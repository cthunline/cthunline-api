import { Note } from '@prisma/client';

import { ForbiddenError } from '../../services/errors.js';
import { Prisma } from '../../services/prisma.js';
import { safeUserSelect } from './user.js';

// get notes of a user for a session ordered by position
// also returns the other user's shared notes in the session
export const getNotes = async (
    sessionId: number,
    userId: number,
    includeUsers: boolean = false
): Promise<Note[]> =>
    Prisma.note.findMany({
        where: {
            AND: [
                {
                    sessionId
                },
                {
                    OR: [
                        {
                            userId
                        },
                        {
                            AND: {
                                NOT: {
                                    userId
                                },
                                isShared: true
                            }
                        }
                    ]
                }
            ]
        },
        include: {
            user: includeUsers
                ? {
                      select: safeUserSelect
                  }
                : false
        },
        orderBy: [
            {
                userId: 'asc'
            },
            {
                position: 'asc'
            }
        ]
    });

// get a note
// if user is not the owner and the note is not shared throw a forbidden error
export const getNote = async (
    noteId: number,
    userId: number
): Promise<Note> => {
    const note = await Prisma.note.findUniqueOrThrow({
        where: {
            id: noteId
        }
    });
    if (note.userId !== userId && !note.isShared) {
        throw new ForbiddenError();
    }
    return note;
};

// get the highest current position for user's notes in a session
// if no notes are found returns 0
export const getMaxNotePosition = async (
    sessionId: number,
    userId: number
): Promise<number> => {
    const note = await Prisma.note.findFirst({
        where: {
            sessionId,
            userId
        },
        orderBy: {
            position: 'desc'
        }
    });
    return note?.position ?? 0;
};

// get the next position for a note to be created
export const getNextNotePosition = async (
    sessionId: number,
    userId: number
): Promise<number> => {
    const maxPosition = await getMaxNotePosition(sessionId, userId);
    return maxPosition + 1;
};

// switch two notes positions
export const switchNotePositions = async (
    sessionId: number,
    userId: number,
    position1: number,
    position2: number
): Promise<number> =>
    Prisma.$executeRaw`UPDATE notes n1 INNER JOIN notes n2 
        ON (n1.position, n2.position) IN (
            (${position1}, ${position2}), 
            (${position2}, ${position1})
        ) 
        AND (n1.sessionId, n2.sessionId) = (${sessionId}, ${sessionId}) 
        AND (n1.userId, n2.userId) = (${userId}, ${userId}) 
        SET n1.position = n2.position;`;

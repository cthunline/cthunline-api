import { Session, Note } from '@prisma/client';

import {
    Prisma,
    handleNotFound
} from './prisma';
import { userSelect } from './user';

export const buildSessionSchema = (baseSchema: any, schemas: any) => ({
    definitions: schemas.definitions,
    ...baseSchema,
    properties: {
        ...baseSchema.properties,
        sketch: schemas.sketch
    }
});

export const defaultSketchData = {
    displayed: false,
    paths: [],
    images: [],
    tokens: [],
    events: []
};

export const getInclude = (includeMaster: boolean) => (
    includeMaster ? {
        include: {
            master: {
                select: userSelect
            }
        }
    } : undefined
);

export const getSession = async (sessionId: string): Promise<Session> => (
    handleNotFound<Session>(
        'Session', (
            Prisma.session.findUnique({
                where: {
                    id: sessionId
                }
            })
        )
    )
);

// get notes of a user for a session / create default notes if not exist
export const getNotes = async (sessionId: string, userId: string): Promise<Note> => {
    const notes = await Prisma.note.findFirst({
        where: {
            sessionId,
            userId
        }
    });
    if (!notes) {
        return Prisma.note.create({
            data: {
                text: '',
                sessionId,
                userId
            }
        });
    }
    return notes;
};

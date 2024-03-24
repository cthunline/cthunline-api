import { getTableColumns, and, eq, ne, or, asc, desc, sql } from 'drizzle-orm';

import { ForbiddenError, NotFoundError } from '../../services/errors.js';
import { db, tables } from '../../services/db.js';
import { safeUserSelect } from './user.js';

/**
Gets notes of a user for a session ordered by position.
Also returns the other user's shared notes in the session.
*/
export const getNotes = async (sessionId: number, userId: number) =>
    db
        .select({
            ...getTableColumns(tables.notes),
            user: safeUserSelect
        })
        .from(tables.notes)
        .where(
            and(
                eq(tables.notes.sessionId, sessionId),
                or(
                    eq(tables.notes.userId, userId),
                    and(
                        ne(tables.notes.userId, userId),
                        eq(tables.notes.isShared, true)
                    )
                )
            )
        )
        .innerJoin(tables.users, eq(tables.users.id, tables.notes.userId))
        .orderBy(asc(tables.notes.userId), asc(tables.notes.position));

/**
Gets a note.
If user is not the owner and the note is not shared throws a forbidden error.
*/
export const getNote = async (noteId: number, userId: number) => {
    const notes = await db
        .select()
        .from(tables.notes)
        .where(eq(tables.notes.id, noteId))
        .limit(1);
    const note = notes[0];
    if (note && note.userId !== userId && !note.isShared) {
        throw new ForbiddenError();
    }
    return note ?? null;
};

/**
Gets a note.
If user is not the owner and the note is not shared throws a forbidden error.
If note does not exist throws a not found error.
*/
export const getNoteOrThrow = async (noteId: number, userId: number) => {
    const note = await getNote(noteId, userId);
    if (!note) {
        throw new NotFoundError('Note not found');
    }
    return note;
};

/**
Gets the highest current position for user's notes in a session.
If no notes are found returns 0.
*/
export const getMaxNotePosition = async (
    sessionId: number,
    userId: number
): Promise<number> => {
    const note = await db
        .select()
        .from(tables.notes)
        .where(
            and(
                eq(tables.notes.sessionId, sessionId),
                eq(tables.notes.userId, userId)
            )
        )
        .orderBy(desc(tables.notes.position))
        .limit(1);
    return note[0]?.position ?? 0;
};

/**
Gets the next position for a note to be created.
*/
export const getNextNotePosition = async (
    sessionId: number,
    userId: number
): Promise<number> => {
    const maxPosition = await getMaxNotePosition(sessionId, userId);
    return maxPosition + 1;
};

/**
Switches the positions of two notes.
*/
export const switchNotePositions = async (
    sessionId: number,
    userId: number,
    position1: number,
    position2: number
) =>
    db.execute(sql`update notes
        set position = case
            when position = ${position1}::integer then ${position2}::integer
            when position = ${position2}::integer then ${position1}::integer
        end
        where session_id = ${sessionId}
        and user_id = ${userId}
        and position in (${position1}, ${position2});`);

import { getTableColumns, and, eq, ne, or, asc, desc, sql } from 'drizzle-orm';

import {
    ForbiddenError,
    InternError,
    NotFoundError
} from '../../services/errors.js';
import { type NoteUpdate, type NoteInsert } from '../../drizzle/schema.js';
import { db, tables } from '../../services/db.js';
import { safeUserSelect } from './user.js';

/**
Gets notes of a user for a session ordered by position.
Also returns the other user's shared notes in the session.
*/
export const getUserSessionNotes = async (userId: number, sessionId: number) =>
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
export const getUserNoteById = async (userId: number, noteId: number) => {
    const notes = await db
        .select()
        .from(tables.notes)
        .where(eq(tables.notes.id, noteId));
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
export const getUserNoteByIdOrThrow = async (
    userId: number,
    noteId: number
) => {
    const note = await getUserNoteById(userId, noteId);
    if (!note) {
        throw new NotFoundError('Note not found');
    }
    return note;
};

/**
Gets the highest current position for user's notes in a session.
If no notes are found returns 0.
*/
export const getUserSessionNoteMaxPosition = async (
    userId: number,
    sessionId: number
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
export const getUserSessionNoteNextPosition = async (
    userId: number,
    sessionId: number
): Promise<number> => {
    const maxPosition = await getUserSessionNoteMaxPosition(userId, sessionId);
    return maxPosition + 1;
};

/**
Switches the positions of two notes.
*/
export const switchUserSessionNotesPositions = async (
    userId: number,
    sessionId: number,
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

/**
Creates a note.
*/
export const createNote = async (data: NoteInsert) => {
    const createdNotes = await db.insert(tables.notes).values(data).returning();
    const createdNote = createdNotes[0];
    if (!createdNote) {
        throw new InternError('Could not retreive inserted note');
    }
    return createdNote;
};

/**
Updates a note with the given ID.
*/
export const updateNoteById = async (noteId: number, data: NoteUpdate) => {
    const updatedNotes = await db
        .update(tables.notes)
        .set(data)
        .where(eq(tables.notes.id, noteId))
        .returning();
    const updatedNote = updatedNotes[0];
    if (!updatedNote) {
        throw new InternError('Could not retreive updated note');
    }
    return updatedNote;
};

/**
Deletes a note with the given ID.
*/
export const deleteNoteById = async (noteId: number) =>
    db.delete(tables.notes).where(eq(tables.notes.id, noteId));

/**
Reorders note position for a given user and session.
*/
export const reorderUserSessionNotes = async (
    userId: number,
    sessionId: number
) =>
    db.execute(sql`with ordered_notes as (
        select id, row_number() over (order by position) as new_position
        from notes
        where session_id = ${sessionId} and user_id = ${userId}
    )
    update notes
    set position = ordered_notes.new_position
    from ordered_notes
    where notes.id = ordered_notes.id;`);

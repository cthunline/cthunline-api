import { eq, getTableColumns } from 'drizzle-orm';

import {
    type SessionInsert,
    type SessionUpdate
} from '../../drizzle/schema.js';
import { InternError, NotFoundError } from '../../services/errors.js';
import { db, tables } from '../../services/db.js';
import { safeUserSelect } from './user.js';

/**
Gets sessions including user data.
*/
export const getSessions = async () =>
    db
        .select({
            ...getTableColumns(tables.sessions),
            master: safeUserSelect
        })
        .from(tables.sessions)
        .innerJoin(tables.users, eq(tables.sessions.masterId, tables.users.id));

/**
Gets sessions belonging to a user (master).
*/
export const getMasterUserSessions = (userId: number) =>
    db
        .select()
        .from(tables.sessions)
        .where(eq(tables.sessions.masterId, userId));

/**
Gets a session with the given ID.
*/
export const getSessionById = async (sessionId: number) => {
    const sessions = await db
        .select()
        .from(tables.sessions)
        .where(eq(tables.sessions.id, sessionId));
    if (sessions[0]) {
        return sessions[0];
    }
    return null;
};

/**
Gets a session with the given ID.
Throws a NotFoundError if it does not exist.
*/
export const getSessionByIdOrThrow = async (sessionId: number) => {
    const session = await getSessionById(sessionId);
    if (!session) {
        throw new NotFoundError('Session not found');
    }
    return session;
};

/**
Creates a session.
*/
export const createSession = async (data: SessionInsert) => {
    const createdSessions = await db
        .insert(tables.sessions)
        .values(data)
        .returning();
    const createdSession = createdSessions[0];
    if (!createdSession) {
        throw new InternError('Could not retreive inserted session');
    }
    return createdSession;
};

/**
Updates a session with the given ID.
*/
export const updateSessionById = async (
    sessionId: number,
    data: SessionUpdate
) => {
    const updatedSessions = await db
        .update(tables.sessions)
        .set(data)
        .where(eq(tables.sessions.id, sessionId))
        .returning();
    const updatedSession = updatedSessions[0];
    if (!updatedSession) {
        throw new InternError('Could not retreive updated session');
    }
    return updatedSession;
};

/**
Deletes a session with the given ID.
*/
export const deleteSessionById = async (sessionId: number) =>
    db.delete(tables.sessions).where(eq(tables.sessions.id, sessionId));

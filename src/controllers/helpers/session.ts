import { eq } from 'drizzle-orm';

import { NotFoundError } from '../../services/errors.js';
import { db, tables } from '../../services/db.js';

export const getSession = async (sessionId: number) => {
    const sessions = await db
        .select()
        .from(tables.sessions)
        .where(eq(tables.sessions.id, sessionId))
        .limit(1);
    return sessions[0] ?? null;
};

export const getSessionOrThrow = async (sessionId: number) => {
    const session = await getSession(sessionId);
    if (!session) {
        throw new NotFoundError('Session not found');
    }
    return session;
};

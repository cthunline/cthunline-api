import { ForbiddenError } from '../../services/errors.js';
import { getSessionByIdOrThrow } from '../../services/queries/session.js';

/**
Builds the cache key for session
*/
export const getSessionCacheKey = (sessionId: number) => `session-${sessionId}`;

/**
Gets the given session, then controls that the given user is the game master of the given session.
If it is not, throws a forbidden error.
*/
export const controlSessionGameMaster = async (
    sessionId: number,
    userId: number
) => {
    const session = await getSessionByIdOrThrow(sessionId);
    if (session.masterId !== userId) {
        throw new ForbiddenError(
            `User ${userId} is not game master in session ${sessionId}`
        );
    }
    return session;
};

/**
Builds the cache key for session
*/
export const getSessionCacheKey = (sessionId: number) => `session-${sessionId}`;

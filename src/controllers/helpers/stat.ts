import type { FastifyInstance } from 'fastify';

import { getCharacterCount } from '../../services/queries/character.js';
import { getSessionCount } from '../../services/queries/session.js';
import { getSocketRoomStats } from '../../sockets/helper.js';
import type { InstanceStats } from '../../types/stats.js';

export const getInstanceStats = async (
    app: FastifyInstance,
    userId: number
): Promise<InstanceStats> => {
    const roomStats = getSocketRoomStats(app);
    const runningSessions = roomStats.length;
    let playingUsers = 0;
    for (const { userCount } of roomStats) {
        playingUsers += userCount;
    }
    const [totalSessions, userCharacterCount, totalCharacterCount] =
        await Promise.all([
            getSessionCount(),
            getCharacterCount(userId),
            getCharacterCount()
        ]);
    return {
        runningSessions,
        totalSessions,
        playingUsers,
        userCharacterCount,
        totalCharacterCount
    };
};

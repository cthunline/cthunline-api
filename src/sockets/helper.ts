import dayjs from 'dayjs';
import type { FastifyInstance } from 'fastify';

import type { SocketIoServer, SocketSessionUser } from '../types/socket.js';
import type { SocketRoomStat } from '../types/stats.js';

export type SocketMeta<T> = T & {
    dateTime: string;
};

export const meta = <T>(emitData: T): SocketMeta<T> => ({
    dateTime: dayjs().toISOString(),
    ...emitData
});

export const getSessionUsers = async (
    io: SocketIoServer,
    sessionId: number
): Promise<SocketSessionUser[]> => {
    const allSockets = await io.in(String(sessionId)).fetchSockets();
    return allSockets.map((socket) => {
        if (socket.data.isMaster) {
            return {
                ...socket.data.user,
                socketId: socket.id,
                character: null,
                isMaster: true
            };
        }
        return {
            ...socket.data.user,
            socketId: socket.id,
            character: socket.data.character,
            isMaster: false
        };
    });
};

export const getSocketRoomStats = (app: FastifyInstance): SocketRoomStat[] => {
    const { io } = app;
    const { rooms } = io.sockets.adapter;
    const stats: SocketRoomStat[] = [];
    for (const [sessionId, socketIds] of rooms.entries()) {
        stats.push({
            sessionId: Number.parseInt(sessionId),
            userCount: socketIds.size
        });
    }
    return stats;
};

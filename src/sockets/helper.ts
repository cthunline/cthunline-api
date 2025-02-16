import dayjs from 'dayjs';
import type { FastifyInstance } from 'fastify';

import { CustomError } from '../services/errors.js';
import { isInteger } from '../services/tools.js';
import type {
    SocketErrorData,
    SocketIoServer,
    SocketSessionUser
} from '../types/socket.js';
import type { SocketRoomStat } from '../types/stats.js';

export type SocketMeta<T> = T & {
    dateTime: string;
};

export const meta = <T>(emitData: T): SocketMeta<T> => ({
    dateTime: dayjs().toISOString(),
    ...emitData
});

export const socketError = (err: unknown): SocketErrorData => {
    const data: SocketErrorData = meta({
        message: 'Unexpected socket error'
    });
    if (err instanceof CustomError) {
        data.message = err.message;
        data.status = err.status;
    } else if (err instanceof Error) {
        data.message = err.message;
    }
    return data;
};

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

// gets socket session rooms by excluding rooms that were created for individual sockets
export const getSocketSessionRooms = (app: FastifyInstance) => {
    const { io } = app;
    const { rooms } = io.sockets.adapter;
    const sessionRooms: Map<string, Set<string>> = new Map();
    for (const [roomId, socketIds] of rooms.entries()) {
        const [socketId] = socketIds;
        if (roomId !== socketId && isInteger(roomId)) {
            sessionRooms.set(roomId, socketIds);
        }
    }
    return sessionRooms;
};

export const getSocketRoomStats = (app: FastifyInstance): SocketRoomStat[] => {
    const rooms = getSocketSessionRooms(app);
    const stats: SocketRoomStat[] = [];
    for (const [sessionId, socketIds] of rooms.entries()) {
        stats.push({
            sessionId: Number.parseInt(sessionId),
            userCount: socketIds.size
        });
    }
    return stats;
};

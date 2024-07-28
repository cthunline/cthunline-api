import type { FastifyInstance } from 'fastify';
import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';

import type { SocketIoSocket } from '../types/socket.js';
import {
    connectedHandler,
    connectionMiddleware,
    parseSocketCookies
} from './connectionHandler.js';

export const socketRouter = (app: FastifyInstance) => {
    const { io } = app;
    io.use((socket: Socket, next: (err?: ExtendedError) => void) => {
        parseSocketCookies(app, socket, next);
    });
    io.use(connectionMiddleware);
    io.on('connection', (socket: SocketIoSocket) =>
        connectedHandler(io, socket)
    );
};

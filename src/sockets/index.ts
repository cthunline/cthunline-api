import { type FastifyInstance } from 'fastify';
import { type Socket } from 'socket.io';

import { type SocketIoSocket } from '../types/socket.js';
import { characterHandler } from './characterHandler.js';
import { sketchHandler } from './sketchHandler.js';
import { audioHandler } from './audioHandler.js';
import { diceHandler } from './diceHandler.js';
import { noteHandler } from './noteHandler.js';
import { meta } from './helper.js';
import {
    connectionMiddleware,
    disconnectCopycats,
    getSessionUsers
} from './connectionHandler.js';

export const socketRouter = (app: FastifyInstance) => {
    const { io } = app;
    io.use((socket: Socket, next: Function) => {
        if (socket.request.headers.cookie) {
            const cookies = app.parseCookie(socket.request.headers.cookie);
            Object.keys(cookies).forEach((key) => {
                cookies[key] =
                    app.unsignCookie(cookies[key].replace(/^s:/, '')).value ??
                    cookies[key];
            });
            socket.data.cookies = cookies;
        }
        next();
    });
    io.use(connectionMiddleware);
    io.on('connection', async (socket: SocketIoSocket) => {
        disconnectCopycats(io, socket);
        const { user, sessionId, isMaster } = socket.data;
        const users = await getSessionUsers(io, sessionId);
        io.sockets.to(String(sessionId)).emit(
            'join',
            meta({
                user,
                users,
                isMaster
            })
        );
        socket.on('disconnect', async () => {
            const sessionUsers = await getSessionUsers(io, sessionId);
            socket.to(String(sessionId)).emit(
                'leave',
                meta({
                    user,
                    users: sessionUsers,
                    isMaster
                })
            );
        });
        diceHandler(io, socket);
        characterHandler(io, socket);
        audioHandler(io, socket);
        sketchHandler(io, socket);
        noteHandler(io, socket);
    });
};

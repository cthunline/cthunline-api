import { FastifyInstance } from 'fastify';
import { Socket } from 'socket.io';

import characterHandler from './characterHandler';
import sketchHandler from './sketchHandler';
import audioHandler from './audioHandler';
import diceHandler from './diceHandler';
import {
    connectionMiddleware,
    disconnectCopycats,
    getSessionUsers
} from './connectionHandler';

import { meta } from './helper';

const socketRouter = (app: FastifyInstance) => {
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
    io.on('connection', async (socket: Socket) => {
        disconnectCopycats(io, socket);
        const { user, sessionId, isMaster } = socket.data;
        const users = await getSessionUsers(io);
        io.sockets.to(String(sessionId)).emit(
            'join',
            meta({
                user,
                users,
                isMaster
            })
        );
        socket.on('disconnect', async (/* reason: string */) => {
            const sessionUsers = await getSessionUsers(io);
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
    });
};

export default socketRouter;

import { Socket, Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import CookieParser from 'cookie-parser';

import { configuration } from '../services/configuration';
import {
    connectionMiddleware,
    disconnectCopycats,
    getSessionUsers
} from './connectionHandler';
import diceHandler from './diceHandler';
import characterHandler from './characterHandler';
import audioHandler from './audioHandler';
import sketchHandler from './sketchHandler';

const { COOKIE_SECRET } = configuration;

const wrapExpressMiddleware = (middleware: Function) => (
    (socket: Socket, next: Function) => (
        middleware(socket.request, {}, next)
    )
);

const socketRouter = (httpServer: HttpServer) => {
    const io = new Server(httpServer);
    io.use(wrapExpressMiddleware(
        CookieParser(COOKIE_SECRET)
    ));
    io.use(connectionMiddleware);
    io.on('connection', async (socket: Socket) => {
        disconnectCopycats(io, socket);
        const { user, sessionId, isMaster } = socket.data;
        const users = await getSessionUsers(io);
        io.sockets.to(String(sessionId)).emit('join', {
            user,
            users,
            isMaster
        });
        socket.on('disconnect', async (/* reason: string */) => {
            const sessionUsers = await getSessionUsers(io);
            socket.to(String(sessionId)).emit('leave', {
                user,
                users: sessionUsers,
                isMaster
            });
        });
        diceHandler(io, socket);
        characterHandler(io, socket);
        audioHandler(io, socket);
        sketchHandler(io, socket);
    });
};

export default socketRouter;

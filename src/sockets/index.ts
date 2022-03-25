import { Socket, Server } from 'socket.io';
import { Server as HttpServer } from 'http';
import CookieParser from 'cookie-parser';

import {
    connectionMiddleware,
    disconnectCopycats,
    getSessionUsers
} from './connect';
import bindDice from './dice';
import bindCharacter from './character';
import bindAudio from './audio';
import bindSketch from './sketch';

const wrapExpressMiddleware = (middleware: Function) => (
    (socket: Socket, next: Function) => (
        middleware(socket.request, {}, next)
    )
);

const socketRouter = (httpServer: HttpServer) => {
    const io = new Server(httpServer);
    io.use(wrapExpressMiddleware(
        CookieParser(process.env.COOKIE_SECRET)
    ));
    io.use(connectionMiddleware);
    io.on('connection', async (socket: Socket) => {
        disconnectCopycats(io, socket);
        const { user, sessionId, isMaster } = socket.data;
        const users = await getSessionUsers(io);
        io.sockets.to(sessionId).emit('join', {
            user,
            users,
            isMaster
        });
        socket.on('disconnect', async (/* reason: string */) => {
            const sessionUsers = await getSessionUsers(io);
            socket.to(sessionId).emit('leave', {
                user,
                users: sessionUsers,
                isMaster
            });
        });
        bindDice(io, socket);
        bindCharacter(io, socket);
        bindAudio(io, socket);
        bindSketch(io, socket);
    });
};

export default socketRouter;

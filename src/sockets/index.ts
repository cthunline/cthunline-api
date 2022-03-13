import { Socket, Server } from 'socket.io';
import { Server as HttpServer } from 'http';

import {
    connectionMiddleware,
    disconnectCopycats
} from './connect';
import bindDice from './dice';
import bindCharacter from './character';
import bindAudio from './audio';

const socketRouter = (httpServer: HttpServer) => {
    const io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN
        }
    });
    io.use(connectionMiddleware);
    io.on('connection', (socket: Socket) => {
        disconnectCopycats(io, socket);
        const { user, sessionId, isMaster } = socket.data;
        socket.to(sessionId).emit('join', { user, isMaster });
        socket.on('disconnect', (/* reason: string */) => {
            socket.to(sessionId).emit('leave', { user, isMaster });
        });
        bindDice(io, socket);
        bindCharacter(io, socket);
        bindAudio(io, socket);
    });
};

export default socketRouter;

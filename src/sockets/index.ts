import { Socket, Server } from 'socket.io';
import { Server as HttpServer } from 'http';

import Log from '../services/log';
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
        const { userId, sessionId, isMaster } = socket.data;
        Log.info(`Socket connected (userId: ${userId}, sessionId: ${sessionId}, isMaster: ${isMaster})`);
        socket.on('disconnect', (reason: string) => {
            Log.info(`Socket disconnected (${reason})`);
        });
        bindDice(io, socket);
        bindCharacter(io, socket);
        bindAudio(io, socket);
    });
};

export default socketRouter;

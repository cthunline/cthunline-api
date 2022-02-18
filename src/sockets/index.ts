import { Socket, Server } from 'socket.io';
import { Server as HttpServer } from 'http';

import Log from '../services/log';
import connectionMiddleware from './connect';
import bindDice from './dice';

const socketRouter = (httpServer: HttpServer) => {
    const io = new Server(httpServer);
    io.use(connectionMiddleware);
    io.on('connection', (socket: Socket) => {
        const { userId, sessionId, isMaster } = socket.data;
        Log.info(`Socket connected (userId: ${userId}, sessionId: ${sessionId}, isMaster: ${isMaster})`);
        socket.on('disconnect', (reason: string) => {
            Log.info(`Socket disconnected (${reason})`);
        });
        bindDice(io, socket);
    });
};

export default socketRouter;

import { Server as SocketIoServer, Socket } from 'socket.io';
import { Server } from 'http';
import { ObjectId } from 'bson';

import { Prisma } from '../services/prisma';
import Log from '../services/log';
import {
    AuthenticationError,
    NotFoundError,
    ValidationError
} from '../services/errors';
import bindDice from './dice';

const connectionMiddleware = async (socket: Socket, next: Function) => {
    try {
        const bearer = socket.handshake.auth.token as string;
        if (!bearer) {
            throw new ValidationError('Missing bearer token in handshare auth', true);
        }
        const sessionId = socket.handshake.query.sessionId as string;
        if (!sessionId || !ObjectId.isValid(sessionId)) {
            throw new ValidationError('Missing session ID in handshare query', true);
        }
        // verify auth token
        const token = await Prisma.token.findFirst({
            where: {
                bearer,
                limit: {
                    gt: new Date()
                }
            }
        });
        if (!token) {
            throw new AuthenticationError('Invalid authentication token', true);
        }
        // check session exists
        const session = await Prisma.session.findUnique({
            where: {
                id: sessionId
            }
        });
        if (!session) {
            throw new NotFoundError(`Session with ID ${sessionId} does not exist`, true);
        }
        // set data on socket
        socket.data.userId = token.userId;
        socket.data.user = await Prisma.user.findUnique({
            where: {
                id: token.userId
            }
        });
        socket.data.sessionId = session.id;
        socket.data.isMaster = session.masterId === token.userId;
        // join session room
        socket.join(session.id);
        //
        next();
    } catch (err) {
        next(err);
    }
};

const onConnect = (socket: Socket) => {
    const { userId, sessionId, isMaster } = socket.data;
    Log.info(`Socket connected (userId: ${userId}, sessionId: ${sessionId}, isMaster: ${isMaster})`);
    socket.on('disconnect', (reason: string) => {
        Log.info(`Socket disconnected (${reason})`);
    });
    bindDice(socket);
};

const socketRouter = (server: Server) => {
    const io = new SocketIoServer(server);
    io.use(connectionMiddleware);
    io.on('connection', onConnect);
};

export default socketRouter;

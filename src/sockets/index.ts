import { Server as SocketIoServer, Socket } from 'socket.io';
import { Server } from 'http';
import { Prisma } from '../services/prisma';
import Log from '../services/log';
import {
    AuthenticationError,
    NotFoundError
} from '../services/errors';
import bindDice from './dice';

const connectionMiddleware = async (socket: Socket, next: Function) => {
    try {
        // verify auth token
        const bearer = socket.handshake.auth.token as string;
        const token = await Prisma.token.findFirst({
            where: {
                bearer,
                limit: {
                    gt: new Date()
                }
            }
        });
        if (!token) {
            throw new AuthenticationError('Invalid authentication token');
        }
        // check game exists
        const gameId = socket.handshake.query.gameId as string;
        const game = await Prisma.game.findUnique({
            where: {
                id: gameId as string
            }
        });
        if (!game) {
            throw new NotFoundError(`Game with ID ${gameId} does not exist`);
        }
        // set data on socket
        socket.data.userId = token.userId;
        socket.data.user = await Prisma.user.findUnique({
            where: {
                id: token.userId
            }
        });
        socket.data.gameId = game.id;
        socket.data.isMaster = game.masterId === token.userId;
        // join game room
        socket.join(game.id);
        //
        next();
    } catch (err) {
        next(err);
    }
};

const onConnect = (socket: Socket) => {
    const { userId, gameId, isMaster } = socket.data;
    Log.info(`Socket connected (userId: ${userId}, gameId: ${gameId}, isMaster: ${isMaster})`);
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

import { Server as SocketIoServer, Socket } from 'socket.io';
import { Server } from 'http';
import { Prisma } from '../services/prisma';
// import gameRouter from './game';
import Log from '../services/log';
import { AuthenticationError } from '../services/errors';
import { getBearerValidToken } from '../controllers/auth';

const authMiddleware = async (socket: Socket, next: Function) => {
    const bearer = socket.handshake.auth.token;
    const token = await getBearerValidToken(bearer);
    if (token) {
        next();
    } else {
        next(new AuthenticationError());
    }
};

const onConnect = async (socket: Socket) => {
    const { gameId } = socket.handshake.query;
    /* const game = */await Prisma.game.findUnique({
        where: {
            id: gameId as string
        }
    });
    Log.info('Web socket connected');
};

const socketRouter = (server: Server) => {
    const io = new SocketIoServer(server);
    io.use(authMiddleware);
    io.on('connection', onConnect);
};

export default socketRouter;

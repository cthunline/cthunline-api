import { Server as SocketIoServer } from 'socket.io';
import { Server } from 'http';
// import gameRouter from './game';
import Log from '../services/log';
import { AuthenticationError } from '../services/errors';
import { getBearerValidToken } from '../controllers/auth';

const socketRouter = (server: Server) => {
    const io = new SocketIoServer(server);

    io.use(async (socket, next) => {
        const bearer = socket.handshake.auth.token;
        const token = await getBearerValidToken(bearer);
        if (token) {
            next();
        } else {
            next(new AuthenticationError());
        }
    });

    io.on('connection', (/* socket */) => {
        Log.info('Web socket connected');
        // const { gameId } = socket.handshake.query;
    });
};

export default socketRouter;

import { Socket } from 'socket.io';
import { ObjectId } from 'bson';

import { Prisma } from '../services/prisma';
import {
    CustomError,
    AuthenticationError,
    NotFoundError,
    ValidationError
} from '../services/errors';

// handles socket connection
// verifies authentication bearer token and session id
const authMiddleware = async (socket: Socket, next: Function) => {
    try {
        const bearer = socket.handshake.auth.token as string;
        if (!bearer) {
            throw new ValidationError('Missing bearer token in handshare auth');
        }
        const sessionId = socket.handshake.query.sessionId as string;
        if (!sessionId || !ObjectId.isValid(sessionId)) {
            throw new ValidationError('Missing session ID in handshare query');
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
            throw new AuthenticationError('Invalid authentication token');
        }
        // check session exists
        const session = await Prisma.session.findUnique({
            where: {
                id: sessionId
            }
        });
        if (!session) {
            throw new NotFoundError(`Session with ID ${sessionId} does not exist`);
        }
        // set data on socket
        socket.data.userId = token.userId;
        socket.data.sessionId = session.id;
        socket.data.isMaster = session.masterId === token.userId;
        // join session room
        socket.join(session.id);
        //
        next();
    } catch (err: any) {
        // due to socket.io middleware error handling
        // we have to pass all error info in the data property
        const { message, status, data } = err;
        const connectionError = new CustomError(message, status, {
            message,
            status,
            data
        });
        next(connectionError);
    }
};

export default authMiddleware;

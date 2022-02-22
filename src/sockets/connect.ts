import { Socket, Server } from 'socket.io';
import { ObjectId } from 'bson';
import {
    Token,
    Session,
    Character
} from '@prisma/client';

import { Prisma } from '../services/prisma';
import {
    CustomError,
    AuthenticationError,
    NotFoundError,
    ValidationError,
    ForbiddenError
} from '../services/errors';
import { findUser } from '../controllers/user';

// verify auth token
const verifyBearer = async (socket: Socket): Promise<Token> => {
    const bearer = socket.handshake.auth.token as string;
    if (!bearer) {
        throw new ValidationError('Missing bearer token in handshare auth');
    }
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
    return token;
};

// verify session
const verifySession = async (socket: Socket): Promise<Session> => {
    const sessionId = socket.handshake.query.sessionId as string;
    if (!sessionId || !ObjectId.isValid(sessionId)) {
        throw new ValidationError('Missing sessionId in handshare query');
    }
    const session = await Prisma.session.findUnique({
        where: {
            id: sessionId
        }
    });
    if (!session) {
        throw new NotFoundError(`Session ${sessionId} does not exist`);
    }
    return session;
};

// verify character
const verifyCharacter = async (socket: Socket, userId: string): Promise<Character> => {
    const characterId = socket.handshake.query.characterId as string;
    if (!characterId || !ObjectId.isValid(characterId)) {
        throw new ValidationError('Missing characterId in handshare query');
    }
    const character = await Prisma.character.findUnique({
        where: {
            id: characterId
        }
    });
    if (!character) {
        throw new NotFoundError(`Character ${characterId} does not exist`);
    }
    if (character.userId !== userId) {
        throw new ForbiddenError(`Character ${characterId} does not belong to user ${userId}`);
    }
    return character;
};

// handles socket connection
export const connectionMiddleware = async (socket: Socket, next: Function) => {
    try {
        const token = await verifyBearer(socket);
        const user = await findUser(token.userId);
        const session = await verifySession(socket);
        const isMaster = session.masterId === token.userId;
        const character = isMaster ? null : (
            await verifyCharacter(socket, token.userId)
        );
        // set data on socket
        socket.data = {
            user,
            characterId: character?.id,
            sessionId: session.id,
            isMaster
        };
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

// searches for other connected sockets with same userId and disconnect them
export const disconnectCopycats = async (io: Server, socket: Socket) => {
    const { id: socketId } = socket;
    const userId = socket.data.user.id;
    const allSockets = await io.fetchSockets();
    const copycatSockets = allSockets.filter((otherSocket) => (
        otherSocket.id !== socketId && otherSocket.data.user.id === userId
    ));
    copycatSockets.forEach((copycatSocket) => {
        copycatSocket.disconnect();
    });
};

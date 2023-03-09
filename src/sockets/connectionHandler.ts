import { Socket, Server } from 'socket.io';
import { Session, Character } from '@prisma/client';

import { UserSelect } from '../types/user';
import { Prisma } from '../services/prisma';
import { verifyJwt } from '../services/crypto';
import { cacheGet, cacheSet } from '../services/cache';
import {
    CustomError,
    AuthenticationError,
    NotFoundError,
    ValidationError,
    ForbiddenError
} from '../services/errors';

// verify auth token
const verifyToken = async (socket: Socket): Promise<UserSelect> => {
    const token = (socket.request as any).signedCookies.token as string;
    if (!token) {
        throw new AuthenticationError('Missing authentication cookie');
    }
    return verifyJwt<UserSelect>(token);
};

// verify session
const verifySession = async (socket: Socket): Promise<Session> => {
    const sessionId = Number(socket.handshake.query.sessionId);
    if (!sessionId) {
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
const verifyCharacter = async (
    socket: Socket,
    userId: number
): Promise<Character> => {
    const characterId = Number(socket.handshake.query.characterId);
    if (!characterId) {
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
        throw new ForbiddenError(
            `Character ${characterId} does not belong to user ${userId}`
        );
    }
    return character;
};

// handles socket connection
export const connectionMiddleware = async (socket: Socket, next: Function) => {
    try {
        const user = await verifyToken(socket);
        const session = await verifySession(socket);
        const isMaster = session.masterId === user.id;
        const character = isMaster
            ? null
            : await verifyCharacter(socket, user.id);
        // set data on socket
        // eslint-disable-next-line no-param-reassign
        socket.data = {
            user,
            characterId: character?.id,
            character,
            sessionId: session.id,
            session,
            isMaster
        };
        // stores sketch data in cache if not set already
        const cacheId = `sketch-${session.id}`;
        if (!cacheGet(cacheId)) {
            cacheSet(cacheId, () => session.sketch);
        }
        // join session room
        socket.join(session.id.toString());
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
    const copycatSockets = allSockets.filter(
        (otherSocket) =>
            otherSocket.id !== socketId && otherSocket.data.user.id === userId
    );
    copycatSockets.forEach((copycatSocket) => {
        copycatSocket.disconnect();
    });
};

export const getSessionUsers = async (io: Server) => {
    const allSockets = await io.fetchSockets();
    return allSockets.map((socket) => ({
        ...socket.data.user,
        character: socket.data.character,
        isMaster: socket.data.isMaster,
        socketId: socket.id
    }));
};

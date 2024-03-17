import { Session, Character } from '@prisma/client';
import { type ExtendedError } from 'socket.io/dist/namespace';

import { decrypt, verifyJwt } from '../services/crypto.js';
import { cacheGet, cacheSet } from '../services/cache.js';
import { prisma } from '../services/prisma.js';
import {
    type SocketIoServer,
    type SocketSessionUser,
    type SocketIoSocket
} from '../types/socket.js';
import {
    CustomError,
    AuthenticationError,
    NotFoundError,
    ValidationError,
    ForbiddenError
} from '../services/errors.js';

import { SafeUser } from '../types/user.js';
import { getEnv } from '../services/env.js';

// verify auth token
const verifySocketJwt = async (socket: SocketIoSocket): Promise<SafeUser> => {
    const { jwt } = socket.data.cookies;
    if (!jwt) {
        throw new AuthenticationError('Missing authentication cookie');
    }
    try {
        const decryptedJwt = decrypt(jwt, getEnv('CRYPTO_SECRET'));
        return verifyJwt(decryptedJwt);
    } catch {
        throw new AuthenticationError('Could not verify JWT');
    }
};

// verify session
const verifySession = async (socket: SocketIoSocket): Promise<Session> => {
    const sessionId = Number(socket.handshake.query.sessionId);
    if (!sessionId) {
        throw new ValidationError('Missing sessionId in handshare query');
    }
    const session = await prisma.session.findUnique({
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
    socket: SocketIoSocket,
    userId: number
): Promise<Character> => {
    const characterId = Number(socket.handshake.query.characterId);
    if (!characterId) {
        throw new ValidationError('Missing characterId in handshare query');
    }
    const character = await prisma.character.findUnique({
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
export const connectionMiddleware = async (
    socket: SocketIoSocket,
    next: (err?: ExtendedError | undefined) => void
) => {
    try {
        const user = await verifySocketJwt(socket);
        const session = await verifySession(socket);
        const isMaster = session.masterId === user.id;
        // set data on socket
        const socketBaseData = {
            user,
            sessionId: session.id,
            session
        };
        if (isMaster) {
            socket.data = {
                ...socket.data,
                ...socketBaseData,
                isMaster: true,
                character: null,
                characterId: null
            };
        } else {
            const character = await verifyCharacter(socket, user.id);
            socket.data = {
                ...socket.data,
                ...socketBaseData,
                isMaster: false,
                character,
                characterId: character.id
            };
        }
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
export const disconnectCopycats = async (
    io: SocketIoServer,
    socket: SocketIoSocket
) => {
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

export const getSessionUsers = async (
    io: SocketIoServer
): Promise<SocketSessionUser[]> => {
    const allSockets = await io.fetchSockets();
    return allSockets.map((socket) => {
        if (socket.data.isMaster) {
            return {
                ...socket.data.user,
                socketId: socket.id,
                character: null,
                isMaster: true
            };
        }
        return {
            ...socket.data.user,
            socketId: socket.id,
            character: socket.data.character,
            isMaster: false
        };
    });
};

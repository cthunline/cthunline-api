import type { FastifyInstance } from 'fastify';
import type { Socket } from 'socket.io';
import type { ExtendedError } from 'socket.io/dist/namespace';

import {
    type CacheJwtData,
    getJwtCacheKey
} from '../controllers/helpers/auth.js';
import { getCharacterCacheKey } from '../controllers/helpers/character.js';
import { getSketchCacheKey } from '../controllers/helpers/sketch.js';
import type { SketchBody } from '../controllers/schemas/definitions.js';
import type { Character, SafeUser, Session } from '../drizzle/schema.js';
import { cache } from '../services/cache.js';
import { decrypt, verifyJwt } from '../services/crypto.js';
import { getEnv } from '../services/env.js';
import {
    AuthenticationError,
    CustomError,
    ForbiddenError,
    NotFoundError,
    ValidationError
} from '../services/errors.js';
import { getCharacterById } from '../services/queries/character.js';
import { getSessionByIdOrThrow } from '../services/queries/session.js';
import type { SocketIoServer, SocketIoSocket } from '../types/socket.js';
import { audioHandler } from './audioHandler.js';
import { characterHandler } from './characterHandler.js';
import { diceHandler } from './diceHandler.js';
import { getSessionUsers, meta } from './helper.js';
import { noteHandler } from './noteHandler.js';
import { sketchHandler } from './sketchHandler.js';

// cookie parsing middleware
export const parseSocketCookies = (
    app: FastifyInstance,
    socket: Socket,
    next: (err?: ExtendedError) => void
) => {
    if (socket.request.headers.cookie) {
        const cookies = app.parseCookie(socket.request.headers.cookie);
        for (const key of Object.keys(cookies)) {
            cookies[key] =
                app.unsignCookie(cookies[key].replace(/^s:/, '')).value ??
                cookies[key];
        }
        socket.data.cookies = cookies;
    }
    next();
};

// verify auth token
const verifySocketJwt = async (socket: SocketIoSocket): Promise<SafeUser> => {
    const { jwt } = socket.data.cookies;
    if (!jwt) {
        throw new AuthenticationError('Missing authentication cookie');
    }
    const decryptedJwt = decrypt(
        jwt,
        getEnv('CRYPTO_SECRET'),
        AuthenticationError
    );
    const jwtUser = verifyJwt(decryptedJwt);
    const cacheJwtData = await cache.getJson<CacheJwtData>(
        getJwtCacheKey(jwtUser.id)
    );
    if (!cacheJwtData || cacheJwtData.jwt !== decryptedJwt) {
        throw new AuthenticationError('JWT is not valid');
    }
    return cacheJwtData.user;
};

// verify session
const verifySession = async (socket: SocketIoSocket): Promise<Session> => {
    const sessionId = Number(socket.handshake.query.sessionId);
    if (!sessionId) {
        throw new ValidationError('Missing sessionId in handshare query');
    }
    const session = await getSessionByIdOrThrow(sessionId);
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
    const character = await getCharacterById(characterId);
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
            const charCacheKey = getCharacterCacheKey(character.id);
            await cache.setJson<Character>(charCacheKey, character);
        }
        // stores sketch data in cache if not set already
        const sketchCacheKey = getSketchCacheKey(session.id);
        const cachedSketch = await cache.getJson<SketchBody>(sketchCacheKey);
        if (!cachedSketch) {
            await cache.setJson<SketchBody>(
                sketchCacheKey,
                session.sketch as SketchBody
            );
        }
        // join session room
        socket.join(session.id.toString());
        //
        next();
    } catch (err: unknown) {
        // due to socket.io middleware error handling
        // we have to pass all error info in the data property
        const { message, status, data } =
            err instanceof CustomError
                ? err
                : {
                      message: 'Intern error',
                      status: 500,
                      data: undefined
                  };
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
    for (const copycatSocket of copycatSockets) {
        copycatSocket.disconnect();
    }
};

export const connectedHandler = async (
    io: SocketIoServer,
    socket: SocketIoSocket
) => {
    disconnectCopycats(io, socket);
    const { user, sessionId, isMaster } = socket.data;
    const sessionUsers = await getSessionUsers(io, sessionId);
    io.sockets.to(String(sessionId)).emit(
        'join',
        meta({
            user,
            users: sessionUsers,
            isMaster
        })
    );
    socket.on('disconnect', async () => {
        const sessionUsers = await getSessionUsers(io, sessionId);
        socket.to(String(sessionId)).emit(
            'leave',
            meta({
                user,
                users: sessionUsers,
                isMaster
            })
        );
    });
    diceHandler(io, socket);
    characterHandler(io, socket);
    audioHandler(io, socket);
    sketchHandler(io, socket);
    noteHandler(io, socket);
};

import { io, type Socket } from 'socket.io-client';
import { fastifyCookie } from '@fastify/cookie';
import { expect, afterEach } from 'vitest';

import { getMasterUserSessions } from '../../../src/services/queries/session.js';
import { sessionsData, charactersData, usersData } from './data.helper.js';
import { type Session } from '../../../src/drizzle/schema.js';
import { assertSocketMeta } from './assert.helper.js';
import { getEnv } from '../../../src/services/env.js';
import { api } from './api.helper.js';

interface SetupSessionReturn {
    sockets: Socket[];
    session: Omit<Session, 'createdAt' | 'updatedAt'>;
    emails: string[];
}

interface SocketsHelper {
    url: string;
    connectedSockets: Socket[];
    getSocketClient: (data: GetSocketClientData) => Socket;
    connect: (connectionData?: SocketConnectionData) => Promise<Socket>;
    connectRole: (isMaster: boolean) => Promise<Socket>;
    failConnect: (data: FailSocketConnectionData) => Promise<void>;
    setupSession: () => Promise<SetupSessionReturn>;
    testError: (data: TestErrorData) => Promise<void>;
}

interface GetSocketClientData {
    jwt?: string;
    query?: object;
}

export interface FailSocketConnectionData {
    jwt?: string;
    query?: object;
    status: number;
}

export interface SocketConnectionData {
    jwt?: string;
    sessionId?: number;
    characterId?: number;
    isMaster?: boolean;
    socket?: Socket;
}

export interface TestErrorData {
    emitEvent: string;
    onEvent: string;
    data: any;
    expectedStatus: number;
    isMaster: boolean;
}

export const socketHelper: SocketsHelper = {
    url: `http://localhost:${getEnv('PORT')}`,
    connectedSockets: [],

    getSocketClient: ({ jwt, query }: GetSocketClientData) => {
        const socketClient = io(socketHelper.url, {
            query,
            autoConnect: false
        });
        if (jwt) {
            const signed = fastifyCookie.sign(
                jwt,
                process.env.COOKIE_SECRET ?? ''
            );
            socketClient.io.opts.extraHeaders = {
                cookie: `jwt=s:${signed}`
            };
        }
        return socketClient;
    },

    connect: async (connectionData?: SocketConnectionData) => {
        const sessionId = connectionData?.sessionId ?? sessionsData[1].id;
        const characterId = connectionData?.characterId ?? charactersData[0].id;
        return new Promise((resolve, reject) => {
            const socket =
                connectionData?.socket ??
                socketHelper.getSocketClient({
                    jwt: connectionData?.jwt,
                    query: {
                        sessionId,
                        ...(connectionData?.isMaster ? {} : { characterId })
                    }
                });
            socket.connect();
            socket.on('connect', () => {
                resolve(socket);
            });
            socket.on('connect_error', (err: any) => {
                reject(err);
            });
            socketHelper.connectedSockets.push(socket);
        });
    },

    connectRole: async (isMaster: boolean) => {
        const { id, jwt } = await api.login();
        const sessionId = sessionsData.find(({ masterId }) =>
            isMaster ? id === masterId : id !== masterId
        )?.id;
        const characterId = charactersData.find(
            (char) => char.userId === api.userId
        )?.id;
        return socketHelper.connect({
            jwt,
            sessionId,
            characterId
        });
    },

    failConnect: async ({ jwt, query, status }: FailSocketConnectionData) =>
        new Promise((resolve, reject) => {
            const socket = socketHelper.getSocketClient({
                jwt,
                query
            });
            socket.connect();
            socket.on('connect', () => {
                reject(new Error('Should have fail to connect'));
            });
            socket.on('connect_error', (err: any) => {
                expect(err.data.status).to.equal(status);
                resolve();
            });
        }),

    // setup a session with a game master and 2 players
    // returns array with master socket, player1 socker and player2 socket
    setupSession: async () => {
        const [masterEmail, player1Email, player2Email] = usersData.map(
            ({ email }) => email
        );
        const masterJWTUser = await api.login({
            email: masterEmail,
            password: 'test'
        });
        const player1JWTUser = await api.login({
            email: player1Email,
            password: 'test'
        });
        const player2JWTUser = await api.login({
            email: player2Email,
            password: 'test'
        });
        const sessions = await getMasterUserSessions(masterJWTUser.id);
        const session = sessions[0];
        if (!session) {
            throw new Error('Could not find session to setup');
        }
        const sockets: Socket[] = [];
        sockets.push(
            await socketHelper.connect({
                jwt: masterJWTUser.jwt,
                sessionId: session.id
            })
        );
        sockets.push(
            await socketHelper.connect({
                jwt: player1JWTUser.jwt,
                sessionId: session.id,
                characterId: charactersData.find(
                    (character) => character.userId === player1JWTUser.id
                )?.id
            })
        );
        sockets.push(
            await socketHelper.connect({
                jwt: player2JWTUser.jwt,
                sessionId: session.id,
                characterId: charactersData.find(
                    (character) => character.userId === player2JWTUser.id
                )?.id
            })
        );
        return {
            sockets,
            session,
            emails: [masterEmail, player1Email, player2Email]
        };
    },

    testError: async ({
        emitEvent,
        onEvent,
        data,
        expectedStatus,
        isMaster = false
    }: TestErrorData) => {
        const socket = await socketHelper.connectRole(isMaster);
        let invalidData = data;
        if (typeof data === 'function') {
            invalidData = data(api.userId);
        }
        if (!Array.isArray(invalidData)) {
            invalidData = [invalidData];
        }
        for (const emitData of invalidData) {
            await new Promise<void>((resolve, reject) => {
                socket.on(onEvent, () => {
                    socket.disconnect();
                    reject(
                        new Error(
                            `Should have thrown a ${expectedStatus} error`
                        )
                    );
                });
                socket.on('error', (errorData: any) => {
                    assertSocketMeta(errorData);
                    expect(errorData.status).to.equal(expectedStatus);
                    resolve();
                });
                socket.emit(emitEvent, emitData);
            });
        }
        socket.disconnect();
    }
};

afterEach(() => {
    socketHelper.connectedSockets.forEach((socket) => {
        socket.disconnect();
    });
});

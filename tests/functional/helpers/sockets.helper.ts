import { fastifyCookie } from '@fastify/cookie';
import { io, Socket } from 'socket.io-client';
import { expect } from 'chai';

import { getEnv } from '../../../src/services/env';

import { sessionsData, charactersData, usersData } from './data.helper';
import { assertSocketMeta } from './assert.helper';
import Api from './api.helper';

interface SocketsHelper {
    url: string;
    connectedSockets: Socket[];
    getSocketClient: Function;
    connect: Function;
    connectRole: Function;
    failConnect: Function;
    setupSession: Function;
    testError: Function;
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
}

const Sockets: SocketsHelper = {
    url: `http://localhost:${getEnv('PORT')}`,
    connectedSockets: [],

    getSocketClient: ({ jwt, query }: GetSocketClientData) => {
        const socketClient = io(Sockets.url, {
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

    connect: async (connectionData?: SocketConnectionData): Promise<Socket> => {
        const sessionId = connectionData?.sessionId ?? sessionsData[1].id;
        const characterId = connectionData?.characterId ?? charactersData[0].id;
        return new Promise((resolve, reject) => {
            const socket = Sockets.getSocketClient({
                jwt: connectionData?.jwt,
                query: {
                    sessionId,
                    characterId
                }
            });
            socket.connect();
            socket.on('connect', () => {
                resolve(socket);
            });
            socket.on('connect_error', (err: any) => {
                reject(err);
            });
            Sockets.connectedSockets.push(socket);
        });
    },

    connectRole: async (isMaster: boolean) => {
        const { id, jwt } = await Api.login();
        const sessionId = sessionsData.find(({ masterId }) =>
            isMaster ? id === masterId : id !== masterId
        )?.id;
        const characterId = charactersData.find(
            (char) => char.userId === Api.userId
        )?.id;
        return Sockets.connect({
            jwt,
            sessionId,
            characterId
        });
    },

    failConnect: async ({
        jwt,
        query,
        status
    }: FailSocketConnectionData): Promise<void> =>
        new Promise((resolve, reject) => {
            const socket = Sockets.getSocketClient({
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
    setupSession: async (): Promise<Socket[]> => {
        const [masterEmail, player1Email, player2Email] = usersData.map(
            ({ email }) => email
        );
        const masterJWTUser = await Api.login({
            email: masterEmail,
            password: 'test'
        });
        const player1JWTUser = await Api.login({
            email: player1Email,
            password: 'test'
        });
        const player2JWTUser = await Api.login({
            email: player2Email,
            password: 'test'
        });
        const sessionId = sessionsData.find(
            ({ masterId }) => masterJWTUser.id === masterId
        )?.id;
        const sockets: Socket[] = [];
        sockets.push(
            await Sockets.connect({
                jwt: masterJWTUser.jwt,
                sessionId
            })
        );
        sockets.push(
            await Sockets.connect({
                jwt: player1JWTUser.jwt,
                sessionId,
                characterId: charactersData.find(
                    (character) => character.userId === player1JWTUser.id
                )?.id
            })
        );
        sockets.push(
            await Sockets.connect({
                jwt: player2JWTUser.jwt,
                sessionId,
                characterId: charactersData.find(
                    (character) => character.userId === player2JWTUser.id
                )?.id
            })
        );
        return sockets;
    },

    testError: async (
        emitEvent: string,
        onEvent: string,
        data: any,
        expectedStatus: number,
        isMaster: boolean = false
    ) => {
        const invalidData = Array.isArray(data) ? data : [data];
        for (const emitData of invalidData) {
            const socket = await Sockets.connectRole(isMaster);
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
                    socket.disconnect();
                    resolve();
                });
                socket.emit(emitEvent, emitData);
            });
        }
    }
};

afterEach(() => {
    Sockets.connectedSockets.forEach((socket) => {
        socket.disconnect();
    });
});

export default Sockets;

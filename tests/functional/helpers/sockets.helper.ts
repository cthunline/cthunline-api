import { expect } from 'chai';
import Client, {
    Socket,
    ManagerOptions,
    SocketOptions
} from 'socket.io-client';
import CookieSignature from 'cookie-signature';

import Api from './api.helper';
import {
    sessionsData,
    charactersData,
    usersData
} from './data.helper';

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
    token?: string;
    query?: object;
}

export interface FailSocketConnectionData {
    token?: string;
    query?: object;
    status: number;
}

export interface SocketConnectionData {
    token?: string;
    sessionId?: number;
    characterId?: number;
}

interface SocketClientConstructor {
    new (uri: string, opts?: Partial<ManagerOptions & SocketOptions>): Socket;
}

const SocketClient = Client as unknown as SocketClientConstructor;

const Sockets: SocketsHelper = {
    url: 'http://localhost:8080',
    connectedSockets: [],

    getSocketClient: ({ token, query }: GetSocketClientData) => {
        const socketClient = new SocketClient(Sockets.url, {
            query,
            autoConnect: false
        });
        if (token) {
            const signed = CookieSignature.sign(
                token,
                process.env.COOKIE_SECRET ?? ''
            );
            socketClient.io.opts.extraHeaders = {
                cookie: `token=s:${signed}`
            };
        }
        return socketClient;
    },

    connect: async (connectionData?: SocketConnectionData): Promise<Socket> => {
        const sessionId = connectionData?.sessionId ?? sessionsData[1].id;
        const characterId = connectionData?.characterId ?? charactersData[0].id;
        return new Promise((resolve, reject) => {
            const socket = Sockets.getSocketClient({
                token: connectionData?.token,
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
        const { id, token } = await Api.login();
        const sessionId = sessionsData.find(({ masterId }) => (
            isMaster ? id === masterId : id !== masterId
        ))?.id;
        const characterId = charactersData.find((char) => (
            char.userId === Api.userId
        ))?.id;
        return Sockets.connect({
            token,
            sessionId,
            characterId
        });
    },

    failConnect: async ({
        token,
        query,
        status
    }: FailSocketConnectionData): Promise<void> => (
        new Promise((resolve, reject) => {
            const socket = Sockets.getSocketClient({
                token,
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
        })
    ),

    // setup a session with a game master and 2 players
    // returns array with master socket, player1 socker and player2 socket
    setupSession: async (): Promise<Socket[]> => {
        const [masterEmail, player1Email, player2Email] = usersData.map(({ email }) => email);
        const [masterTokenUser, player1TokenUser, player2TokenUser] = (
            await Promise.all(
                [masterEmail, player1Email, player2Email].map((email) => (
                    Api.login({
                        email,
                        password: 'test'
                    })
                ))
            )
        );
        const sessionId = sessionsData.find(({ masterId }) => (
            masterTokenUser.id === masterId
        ))?.id;
        return Promise.all([
            Sockets.connect({
                token: masterTokenUser.token,
                sessionId
            }),
            ...[player1TokenUser, player2TokenUser].map(({ id, token }) => (
                Sockets.connect({
                    token,
                    sessionId,
                    characterId: charactersData.find((character) => (
                        character.userId === id
                    ))?.id
                })
            ))
        ]);
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
                    reject(new Error(`Should have thrown a ${expectedStatus} error`));
                });
                socket.on('error', ({ status }: any) => {
                    expect(status).to.equal(expectedStatus);
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

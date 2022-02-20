import { expect } from 'chai';
import { io, Socket } from 'socket.io-client';

import Api from './api.helper';

import sessionsData from '../data/sessions.json';
import charactersData from '../data/characters.json';
import usersData from '../data/users.json';

export interface FailSocketConnectionData {
    handshake: object;
    status: number;
}

export interface SocketConnectionData {
    bearer?: string;
    sessionId?: string;
    characterId?: string;
}

const Sockets = {
    url: 'http://localhost:8080',

    connect: async (connectionData?: SocketConnectionData): Promise<Socket> => {
        let authToken = connectionData?.bearer;
        if (!authToken) {
            await Api.login();
            authToken = Api.bearer;
        }
        const sessionId = connectionData?.sessionId ?? sessionsData[1].id;
        const characterId = connectionData?.characterId ?? charactersData[0].id;
        return new Promise((resolve, reject) => {
            const socket = io(Sockets.url, {
                auth: {
                    token: authToken
                },
                query: {
                    sessionId,
                    characterId
                }
            });
            socket.on('connect', () => {
                resolve(socket);
            });
            socket.on('connect_error', (err) => {
                reject(err);
            });
        });
    },

    connectRole: async (isMaster: boolean) => {
        const { bearer, userId } = await Api.login();
        const sessionId = sessionsData.find(({ masterId }) => (
            isMaster ? (
                userId === masterId
            ) : (
                userId !== masterId
            )
        ))?.id;
        const characterId = charactersData.find((char) => (
            char.userId === Api.userId
        ))?.id;
        return Sockets.connect({
            bearer,
            sessionId,
            characterId
        });
    },

    failConnect: async ({ handshake, status }: FailSocketConnectionData): Promise<void> => (
        new Promise((resolve, reject) => {
            const socket = io(Sockets.url, handshake);
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
        const [masterToken, player1Token, player2Token] = (
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
            masterToken.userId === masterId
        ))?.id;
        return Promise.all([
            Sockets.connect({
                bearer: masterToken.bearer ?? '',
                sessionId
            }),
            ...[player1Token, player2Token].map(({ bearer, userId }) => (
                Sockets.connect({
                    bearer: bearer ?? '',
                    sessionId,
                    characterId: charactersData.find((character) => (
                        character.userId === userId
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

export default Sockets;

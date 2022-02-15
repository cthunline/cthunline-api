import { expect } from 'chai';
import { io, Socket } from 'socket.io-client';

import Api from './api.helper';

import sessionsData from '../data/sessions.json';

export interface FailSocketConnectionData {
    handshake: object,
    status: number
}

export interface SocketConnectionData {
    bearer?: string,
    sessionId?: string
}

const Sockets = {
    url: 'http://localhost:8080',

    connect: async (connectionData?: SocketConnectionData): Promise<Socket> => {
        let authToken = connectionData?.bearer;
        if (!authToken) {
            await Api.login();
            authToken = Api.bearer;
        }
        const querySessionId = connectionData?.sessionId ?? sessionsData[0].id;
        return new Promise((resolve, reject) => {
            const socket = io(Sockets.url, {
                auth: {
                    token: authToken
                },
                query: {
                    sessionId: querySessionId
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
    )
};

export default Sockets;

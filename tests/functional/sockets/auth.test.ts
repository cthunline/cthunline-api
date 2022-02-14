import { expect } from 'chai';
import { io } from 'socket.io-client';

import Api from '../../helpers/api.helper';
import Data from '../../helpers/data.helper';

import sessionsData from '../../data/sessions.json';

const socketUrl = 'http://localhost:8080';

interface FailSocketConnectionData {
    handshake: object;
    status: number;
}

const failSocketConnection = async ({
    handshake,
    status
}: FailSocketConnectionData): Promise<void> => (
    new Promise((resolve, reject) => {
        const socket = io(socketUrl, handshake);
        socket.on('connect', () => {
            reject();
        });
        socket.on('connect_error', (err: any) => {
            expect(err.data.status).to.equal(status);
            resolve();
        });
    })
);

describe('[Sockets] Authentication', () => {
    beforeEach(async () => {
        await Data.reset();
    });

    it('Should fail to connect socket because of invalid handshake data', async () => {
        await Promise.all([{
            auth: {
                token: 'someToken'
            },
            query: {}
        }, {
            auth: {},
            query: {
                sessionId: sessionsData[0].id
            }
        }, {
            auth: {},
            query: {}
        }, {}].map((handshake) => (
            failSocketConnection({
                handshake,
                status: 400
            })
        )));
    });

    it('Should fail to connect socket because of invalid authentication token', async () => {
        await failSocketConnection({
            handshake: {
                auth: {
                    token: 'invalidToken'
                },
                query: {
                    sessionId: sessionsData[0].id
                }
            },
            status: 401
        });
    });

    it('Should fail to connect socket because of invalid sessionId', async () => {
        await Api.login();
        const { bearer } = Api;
        await failSocketConnection({
            handshake: {
                auth: {
                    token: bearer
                },
                query: {
                    sessionId: 'invalidSessionId'
                }
            },
            status: 400
        });
    });

    it('Should fail to connect socket because of not found sessionId', async () => {
        await Api.login();
        const { bearer } = Api;
        await failSocketConnection({
            handshake: {
                auth: {
                    token: bearer
                },
                query: {
                    sessionId: '1122334455667788aabbccdd'
                }
            },
            status: 404
        });
    });

    it('Should connect to socket', async () => {
        await Api.login();
        const { bearer } = Api;
        await new Promise<void>((resolve, reject) => {
            const socket = io(socketUrl, {
                auth: {
                    token: bearer
                },
                query: {
                    sessionId: sessionsData[0].id
                }
            });
            socket.on('connect', () => {
                socket.disconnect();
                resolve();
            });
            socket.on('connect_error', () => {
                reject();
            });
        });
    });
});

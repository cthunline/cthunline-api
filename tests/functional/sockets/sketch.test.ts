import { expect } from 'chai';

import { sessionsData, resetData } from '../helpers/data.helper.js';
import { socketHelper } from '../helpers/sockets.helper.js';

import {
    assertUser,
    assertSketch,
    assertSocketMeta
} from '../helpers/assert.helper.js';

const sketchData = sessionsData[0].sketch;
const tokenData = sessionsData[0].sketch.tokens[0];

describe('[Sockets] Sketch', () => {
    before(async () => {
        await resetData();
    });

    it('Should fail to update sketch because of invalid data', async () => {
        await socketHelper.testError(
            'sketchUpdate',
            'sketchUpdate',
            [
                {},
                undefined,
                {
                    dislayed: true,
                    paths: [],
                    images: [],
                    invalidKey: 'value'
                },
                {
                    dislayed: 'invalidValue',
                    paths: [],
                    images: []
                },
                {
                    dislayed: true,
                    paths: 'invalidValue',
                    images: []
                },
                {
                    dislayed: false,
                    paths: [],
                    images: 'invalidValue'
                },
                {
                    dislayed: false,
                    images: []
                },
                {
                    dislayed: false,
                    paths: []
                },
                {
                    dislayed: false
                }
            ],
            400,
            true
        );
    });

    it('Should fail to update sketch because not game master', async () => {
        await socketHelper.testError(
            'sketchUpdate',
            'sketchUpdate',
            sketchData,
            403,
            false
        );
    });

    it('Should update sketch', async () => {
        const [masterSocket, player1Socket, player2Socket] =
            await socketHelper.setupSession();
        await Promise.all([
            ...[player1Socket, player2Socket].map(
                (socket) =>
                    new Promise<void>((resolve, reject) => {
                        socket.on('sketchUpdate', (data: any) => {
                            const { user, isMaster, sketch } = data;
                            assertSocketMeta(data);
                            assertUser(user);
                            expect(isMaster).to.be.true;
                            assertSketch(sketch, sketchData);
                            socket.disconnect();
                            resolve();
                        });
                        socket.on('error', (err: any) => {
                            socket.disconnect();
                            reject(err);
                        });
                    })
            ),
            (async () => {
                masterSocket.emit('sketchUpdate', sketchData);
            })()
        ]);
    });

    it('Should fail to update sketch token because of invalid data', async () => {
        await socketHelper.testError(
            'tokenUpdate',
            'tokenUpdate',
            [
                {},
                undefined,
                {
                    id: 1,
                    index: 0,
                    color: 'test'
                }
            ],
            400,
            true
        );
    });

    it('Should update sketch token', async () => {
        const [masterSocket, player1Socket, player2Socket] =
            await socketHelper.setupSession();
        await Promise.all([
            ...[masterSocket, player1Socket].map(
                (socket) =>
                    new Promise<void>((resolve, reject) => {
                        socket.on('sketchUpdate', (data: any) => {
                            const { user, isMaster, sketch } = data;
                            assertSocketMeta(data);
                            assertUser(user);
                            expect(isMaster).to.be.false;
                            assertSketch(sketch, sketchData);
                            socket.disconnect();
                            resolve();
                        });
                        socket.on('error', (err: any) => {
                            socket.disconnect();
                            reject(err);
                        });
                    })
            ),
            (async () => {
                player2Socket.emit('tokenUpdate', tokenData);
            })()
        ]);
    });
});

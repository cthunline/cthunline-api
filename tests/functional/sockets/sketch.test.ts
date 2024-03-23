import { describe, expect, test, beforeAll, beforeEach } from 'vitest';

import { type SketchBody } from '../../../src/controllers/schemas/definitions.js';
import { sessionsData, resetData, resetCache } from '../helpers/data.helper.js';
import { socketHelper } from '../helpers/sockets.helper.js';
import {
    assertUser,
    assertSketch,
    assertSocketMeta
} from '../helpers/assert.helper.js';

describe('[Sockets] Sketch', () => {
    beforeAll(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await resetCache();
    });

    test('Should fail to update sketch because of invalid data', async () => {
        await socketHelper.testError({
            emitEvent: 'sketchUpdate',
            onEvent: 'sketchUpdate',
            data: [
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
            expectedStatus: 400,
            isMaster: true
        });
    });

    test('Should fail to update sketch because not game master', async () => {
        const sketchData = sessionsData[0].sketch;
        await socketHelper.testError({
            emitEvent: 'sketchUpdate',
            onEvent: 'sketchUpdate',
            data: sketchData,
            expectedStatus: 403,
            isMaster: false
        });
    });

    test('Should update sketch', async () => {
        const sketchData = sessionsData[0].sketch;
        const {
            sockets: [masterSocket, player1Socket, player2Socket]
        } = await socketHelper.setupSession();
        await Promise.all([
            ...[player1Socket, player2Socket].map(
                (socket) =>
                    new Promise<void>((resolve, reject) => {
                        socket.on('sketchUpdate', (data: any) => {
                            const { user, isMaster, sketch } = data;
                            assertSocketMeta(data);
                            assertUser(user);
                            expect(isMaster).toEqual(true);
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

    test('Should fail to update sketch token because of invalid data', async () => {
        await socketHelper.testError({
            emitEvent: 'tokenUpdate',
            onEvent: 'tokenUpdate',
            data: [
                {},
                undefined,
                {
                    id: 1,
                    index: 0,
                    color: 'test'
                }
            ],
            expectedStatus: 400,
            isMaster: true
        });
    });

    test('Should update sketch token', async () => {
        const {
            sockets: [masterSocket, player1Socket, player2Socket],
            session
        } = await socketHelper.setupSession();
        const sketchData = session.sketch as SketchBody;
        const token = sketchData.tokens?.[0];
        const anotherToken = sessionsData[1].sketch.tokens[0];
        const updatedTokenData = {
            ...token,
            x: anotherToken.x,
            y: anotherToken.y
        };
        const expectedSketchData = {
            ...sketchData,
            tokens: sketchData.tokens?.map((tok) =>
                tok.id === updatedTokenData.id ? updatedTokenData : tok
            )
        };
        await Promise.all([
            ...[masterSocket, player1Socket].map(
                (socket) =>
                    new Promise<void>((resolve, reject) => {
                        socket.on('sketchUpdate', (data: any) => {
                            const { user, isMaster, sketch } = data;
                            assertSocketMeta(data);
                            assertUser(user);
                            expect(isMaster).toEqual(false);
                            assertSketch(sketch, expectedSketchData);
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
                player2Socket.emit('tokenUpdate', updatedTokenData);
            })()
        ]);
    });
});

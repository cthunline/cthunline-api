import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';

import type { SketchBody } from '../../../src/controllers/schemas/definitions.js';
import { getSessionByIdOrThrow } from '../../../src/services/queries/session.js';
import {
    assertSketchData,
    assertSocketMeta,
    assertUser
} from '../helpers/assert.helper.js';
import { resetCache, resetData, sessionsData } from '../helpers/data.helper.js';
import { socketHelper } from '../helpers/sockets.helper.js';

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
                    dislayed: true,
                    paths: ['invalidValue'],
                    images: []
                },
                {
                    dislayed: true,
                    paths: [{}],
                    images: []
                },
                {
                    dislayed: true,
                    paths: [
                        {
                            d: '',
                            colorfill: '',
                            invalidProperty: 'invalidValue'
                        }
                    ],
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
        const {
            sockets: [masterSocket, player1Socket, player2Socket],
            session
        } = await socketHelper.setupSession();
        const anotherSession = sessionsData.find(({ id }) => id !== session.id);
        const anotherSketch = anotherSession?.sketch;
        if (!anotherSketch) {
            throw new Error('Could not find another sketch to run test');
        }
        await Promise.all([
            ...[player1Socket, player2Socket].map(
                (socket) =>
                    new Promise<void>((resolve, reject) => {
                        socket.on('sketchUpdate', (data: any) => {
                            const { user, isMaster, sketch } = data;
                            assertSocketMeta(data);
                            assertUser(user);
                            expect(isMaster).toEqual(true);
                            assertSketchData(sketch, anotherSketch);
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
                masterSocket.emit('sketchUpdate', anotherSketch);
            })()
        ]);
        await vi.waitFor(
            async () => {
                const updatedSession = await getSessionByIdOrThrow(session.id);
                assertSketchData(
                    updatedSession.sketch as SketchBody,
                    anotherSketch
                );
            },
            {
                interval: 100
            }
        );
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
        const anotherSession = sessionsData.find(({ id }) => id !== session.id);
        const anotherToken = anotherSession?.sketch.tokens[0];
        if (!anotherToken) {
            throw new Error('Could not find another sketch to run test');
        }
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
                            assertSketchData(sketch, expectedSketchData);
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
        await vi.waitFor(
            async () => {
                const updatedSession = await getSessionByIdOrThrow(session.id);
                assertSketchData(
                    updatedSession.sketch as SketchBody,
                    expectedSketchData
                );
            },
            {
                interval: 100
            }
        );
    });
});

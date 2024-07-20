import { beforeAll, beforeEach, describe, expect, test } from 'vitest';

import {
    assertAsset,
    assertSocketMeta,
    assertUser
} from '../helpers/assert.helper.js';
import { assetsData, resetCache, resetData } from '../helpers/data.helper.js';
import { socketHelper } from '../helpers/sockets.helper.js';

const audioAsset = assetsData.find(({ type }) => type === 'audio');

const imageAsset = assetsData.find(({ type }) => type === 'image');

describe('[Sockets] Audio', () => {
    beforeAll(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await resetCache();
    });

    test('Should fail to play audio because of invalid data', async () => {
        await socketHelper.testError({
            emitEvent: 'audioPlay',
            onEvent: 'audioPlay',
            data: [
                {},
                undefined,
                { assetId: audioAsset?.id, invalidKey: 'value' },
                { assetId: 'invalidId', time: 1234 },
                { assetId: 'invalidId' },
                { assetId: imageAsset?.id }
            ],
            expectedStatus: 400,
            isMaster: true
        });
    });

    test('Should fail to play or stop audio because not game master', async () => {
        for (const event of ['audioPlay', 'audioStop']) {
            await socketHelper.testError({
                emitEvent: event,
                onEvent: event,
                data:
                    event === 'audioPlay'
                        ? {
                              assetId: audioAsset?.id
                          }
                        : undefined,
                expectedStatus: 403,
                isMaster: false
            });
        }
    });

    test('Should play or stop audio', async () => {
        for (const event of ['audioPlay', 'audioStop']) {
            const {
                sockets: [masterSocket, player1Socket, player2Socket]
            } = await socketHelper.setupSession();
            await Promise.all([
                ...[player1Socket, player2Socket].map(
                    (socket) =>
                        new Promise<void>((resolve, reject) => {
                            socket.on(event, (data: any) => {
                                const { user, isMaster, asset } = data;
                                assertSocketMeta(data);
                                assertUser(user);
                                expect(isMaster).toEqual(true);
                                if (event === 'audioPlay') {
                                    assertAsset(asset);
                                }
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
                    masterSocket.emit(
                        event,
                        event === 'audioPlay'
                            ? {
                                  assetId: audioAsset?.id,
                                  time: 1234
                              }
                            : undefined
                    );
                })()
            ]);
        }
    });
});

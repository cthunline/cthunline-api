import { beforeAll, beforeEach, describe, test } from 'vitest';

import {
    assertDiceResponse,
    assertSocketMeta
} from '../helpers/assert.helper.js';
import { resetCache, resetData } from '../helpers/data.helper.js';
import { socketHelper } from '../helpers/sockets.helper.js';

describe('[Sockets] Dice', () => {
    beforeAll(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await resetCache();
    });

    test('Should fail to request dice because of invalid data', async () => {
        await socketHelper.testError({
            emitEvent: 'diceRequest',
            onEvent: 'diceResult',
            data: [
                {},
                undefined,
                { invalid: [] },
                { rolls: [] },
                { rolls: [{ dice: 'D4', invalidKey: 3 }] },
                { rolls: [{ dice: 'invalid' }] }
            ],
            expectedStatus: 400,
            isMaster: true
        });
    });

    test('Should fail to request private dice roll because not game master', async () => {
        await socketHelper.testError({
            emitEvent: 'dicePrivateRequest',
            onEvent: 'diceResult',
            data: { rolls: [{ dice: 'D4' }] },
            expectedStatus: 403,
            isMaster: false
        });
    });

    test('Should request dice rolls', async () => {
        const requestData = [
            {
                rolls: [{ dice: 'D4' }, { dice: 'D4' }, { dice: 'D4' }]
            },
            {
                rolls: [{ dice: 'D6' }, { dice: 'D8' }, { dice: 'D8' }]
            },
            {
                rolls: [
                    { dice: 'D12' },
                    { dice: 'D12' },
                    { dice: 'D20' },
                    { dice: 'D20' },
                    { dice: 'D100' }
                ]
            }
        ];
        for (const data of requestData) {
            for (const event of ['diceRequest', 'dicePrivateRequest']) {
                const socket = await socketHelper.connectRole(true);
                await new Promise<void>((resolve, reject) => {
                    socket.on('diceResult', (res: any) => {
                        assertSocketMeta(res);
                        assertDiceResponse(res, {
                            isMaster: true,
                            isPrivate: event === 'dicePrivateRequest',
                            rolls: data.rolls
                        });
                        socket.disconnect();
                        resolve();
                    });
                    socket.on('error', ({ status }: any) => {
                        socket.disconnect();
                        reject(new Error(`${status} error`));
                    });
                    socket.emit(event, data);
                });
            }
        }
    });

    test('Should send dice roll result to all players in session', async () => {
        const {
            sockets: [masterSocket, player1Socket, player2Socket]
        } = await socketHelper.setupSession();
        const data = {
            rolls: [{ dice: 'D12' }, { dice: 'D12' }]
        };
        await Promise.all([
            ...[masterSocket, player1Socket, player2Socket].map(
                (socket) =>
                    new Promise<void>((resolve, reject) => {
                        socket.on('diceResult', (res: any) => {
                            assertSocketMeta(res);
                            assertDiceResponse(res, {
                                isMaster: false,
                                isPrivate: false,
                                rolls: data.rolls
                            });
                            socket.disconnect();
                            resolve();
                        });
                        socket.on('error', (err: any) => {
                            socket.disconnect();
                            reject(err);
                        });
                    })
            ),
            player1Socket.emit('diceRequest', data)
        ]);
    });
});

import { beforeAll, beforeEach, describe, test } from 'vitest';

import {
    assertAlienRollResponse,
    assertSocketMeta
} from '../helpers/assert.helper.js';
import { resetCache, resetData } from '../helpers/data.helper.js';
import { socketHelper } from '../helpers/sockets.helper.js';

describe('[Sockets] Dice for Alien', () => {
    beforeAll(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await resetCache();
    });

    test('Should fail to request dice because of invalid data', async () => {
        await socketHelper.testError({
            emitEvent: 'diceAlienRequest',
            onEvent: 'diceAlienResult',
            data: [
                {},
                undefined,
                { dices: 1 },
                { stresses: 1 },
                { dices: 0, stresses: 1 },
                { dices: 'invalid', stresses: 1 },
                { dices: 3, stresses: 1, invalid: 1 }
            ],
            expectedStatus: 400,
            isMaster: true
        });
    });

    test('Should fail to request private dice roll because not game master', async () => {
        await socketHelper.testError({
            emitEvent: 'diceAlienPrivateRequest',
            onEvent: 'diceAlienResult',
            data: { dices: 1, stresses: 1 },
            expectedStatus: 403,
            isMaster: false
        });
    });

    test('Should request dice rolls', async () => {
        const requestData = [
            { dices: 5, stresses: 0 },
            { dices: 4, stresses: 2 }
        ];
        for (const data of requestData) {
            for (const event of [
                'diceAlienRequest',
                'diceAlienPrivateRequest'
            ]) {
                const socket = await socketHelper.connectRole(true);
                await new Promise<void>((resolve, reject) => {
                    socket.on('diceAlienResult', (res: any) => {
                        assertSocketMeta(res);
                        assertAlienRollResponse(res, {
                            ...data,
                            isMaster: true,
                            isPrivate: event === 'diceAlienPrivateRequest'
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
        const data = { dices: 4, stresses: 2 };
        await Promise.all([
            ...[masterSocket, player1Socket, player2Socket].map(
                (socket) =>
                    new Promise<void>((resolve, reject) => {
                        socket.on('diceAlienResult', (res: any) => {
                            assertSocketMeta(res);
                            assertAlienRollResponse(res, {
                                ...data,
                                isMaster: false,
                                isPrivate: false
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
            player1Socket.emit('diceAlienRequest', data)
        ]);
    });
});

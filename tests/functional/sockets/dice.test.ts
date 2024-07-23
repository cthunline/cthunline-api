import { beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { assertSocketMeta, assertUser } from '../helpers/assert.helper.js';
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
                { D4: 2, invalidKey: 3 },
                { D8: 2, D12: 0 },
                { D20: 2, D100: 'invalidValue' }
            ],
            expectedStatus: 400,
            isMaster: true
        });
    });

    test('Should fail to request private dice roll because not game master', async () => {
        await socketHelper.testError({
            emitEvent: 'dicePrivateRequest',
            onEvent: 'diceResult',
            data: { D4: 2 },
            expectedStatus: 403,
            isMaster: false
        });
    });

    test('Should request dice rolls', async () => {
        const requestData = [
            {
                D4: 3
            },
            {
                D6: 1,
                D8: 2
            },
            {
                D12: 3,
                D20: 2,
                D100: 3
            }
        ];
        for (const data of requestData) {
            for (const event of ['diceRequest', 'dicePrivateRequest']) {
                const socket = await socketHelper.connectRole(true);
                await new Promise<void>((resolve, reject) => {
                    socket.on('diceResult', (resultData: any) => {
                        const { user, isMaster, request, isPrivate, result } =
                            resultData;
                        assertSocketMeta(resultData);
                        assertUser(user);
                        expect(isMaster).toEqual(true);
                        expect(request).toEqual(data);
                        expect(isPrivate).to.equal(
                            event === 'dicePrivateRequest'
                        );
                        expect(result).to.be.a('number');
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
        const diceRequest = {
            D6: 3
        };
        await Promise.all([
            ...[masterSocket, player1Socket, player2Socket].map(
                (socket) =>
                    new Promise<void>((resolve, reject) => {
                        socket.on('diceResult', (resultData: any) => {
                            const {
                                user,
                                isMaster,
                                request,
                                isPrivate,
                                result
                            } = resultData;
                            assertSocketMeta(resultData);
                            assertUser(user);
                            expect(isMaster).toEqual(false);
                            expect(request).toEqual(diceRequest);
                            expect(isPrivate).to.equal(false);
                            expect(result).to.be.a('number');
                            socket.disconnect();
                            resolve();
                        });
                        socket.on('error', (err: any) => {
                            socket.disconnect();
                            reject(err);
                        });
                    })
            ),
            player1Socket.emit('diceRequest', diceRequest)
        ]);
    });
});

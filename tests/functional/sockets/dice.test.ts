import { expect } from 'chai';

import Data from '../helpers/data.helper';
import Sockets from '../helpers/sockets.helper';
import { assertUser } from '../helpers/assert.helper';

describe('[Sockets] Dice', () => {
    beforeEach(async () => {
        await Data.reset();
    });

    it('Should fail to request dice because of invalid data', async () => {
        await Sockets.testError(
            'diceRequest',
            'diceResult',
            [
                {},
                undefined,
                { d4: 2, invalidKey: 3 },
                { d8: 2, d12: 0 },
                { d20: 2, d100: 'invalidValue' }
            ],
            400,
            true
        );
    });

    it('Should fail to request private dice roll because not game master', async () => {
        await Sockets.testError(
            'dicePrivateRequest',
            'diceResult',
            { d4: 2 },
            403,
            false
        );
    });

    it('Should request dice rolls', async () => {
        const requestData = [{
            d4: 3
        }, {
            d6: 1,
            d8: 2
        }, {
            d12: 3,
            d20: 2,
            d100: 3
        }];
        for (const data of requestData) {
            for (const event of ['diceRequest', 'dicePrivateRequest']) {
                const socket = await Sockets.connectRole(true);
                await new Promise<void>((resolve, reject) => {
                    socket.on('diceResult', ({ user, request, result }) => {
                        assertUser(user);
                        expect(request).to.deep.equal(data);
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

    it('Should send dice roll result to all players in session', async () => {
        const [
            masterSocket,
            player1Socket,
            player2Socket
        ] = await Sockets.setupSession();
        await Promise.all([
            ...[masterSocket, player1Socket, player2Socket].map((socket) => (
                new Promise<void>((resolve, reject) => {
                    socket.on('diceResult', () => {
                        socket.disconnect();
                        resolve();
                    });
                    socket.on('error', (err: any) => {
                        socket.disconnect();
                        reject(err);
                    });
                })
            )),
            (async () => {
                player1Socket.emit('diceRequest', {
                    d6: 3
                });
            })()
        ]);
    });
});
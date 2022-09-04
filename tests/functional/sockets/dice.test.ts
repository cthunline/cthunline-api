import { expect } from 'chai';

import Data from '../helpers/data.helper';
import Sockets from '../helpers/sockets.helper';
import { assertSocketMeta, assertUser } from '../helpers/assert.helper';

describe('[Sockets] Dice', () => {
    before(async () => {
        await Data.reset();
    });

    it('Should fail to request dice because of invalid data', async () => {
        await Sockets.testError(
            'diceRequest',
            'diceResult',
            [
                {},
                undefined,
                { D4: 2, invalidKey: 3 },
                { D8: 2, D12: 0 },
                { D20: 2, D100: 'invalidValue' }
            ],
            400,
            true
        );
    });

    it('Should fail to request private dice roll because not game master', async () => {
        await Sockets.testError(
            'dicePrivateRequest',
            'diceResult',
            { D4: 2 },
            403,
            false
        );
    });

    it('Should request dice rolls', async () => {
        const requestData = [{
            D4: 3
        }, {
            D6: 1,
            D8: 2
        }, {
            D12: 3,
            D20: 2,
            D100: 3
        }];
        for (const data of requestData) {
            for (const event of ['diceRequest', 'dicePrivateRequest']) {
                const socket = await Sockets.connectRole(true);
                await new Promise<void>((resolve, reject) => {
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
                        expect(isMaster).to.be.true;
                        expect(request).to.deep.equal(data);
                        expect(isPrivate).to.equal(event === 'dicePrivateRequest');
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
        const diceRequest = {
            D6: 3
        };
        await Promise.all([
            ...[masterSocket, player1Socket, player2Socket].map((socket) => (
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
                        expect(isMaster).to.be.false;
                        expect(request).to.deep.equal(diceRequest);
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
            )),
            (async () => {
                player1Socket.emit('diceRequest', diceRequest);
            })()
        ]);
    });
});

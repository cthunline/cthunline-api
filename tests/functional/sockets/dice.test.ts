import { expect } from 'chai';

import Api from '../../helpers/api.helper';
import Data from '../../helpers/data.helper';
import Sockets from '../../helpers/sockets.helper';

import charactersData from '../../data/characters.json';
import sessionsData from '../../data/sessions.json';

describe('[Sockets] Dice', () => {
    beforeEach(async () => {
        await Data.reset();
    });

    it('Should fail to request dice because of invalid data', async () => {
        const requestData = [{
            d4: 2,
            invalidKey: 3
        }, {
            d8: 2,
            d12: 0
        }, {
            d20: 2,
            d100: 'invalidValue'
        }, {}, undefined];
        for (const data of requestData) {
            const socket = await Sockets.connect();
            await new Promise<void>((resolve, reject) => {
                socket.on('diceResult', () => {
                    socket.disconnect();
                    reject(new Error('Should have throw a validation error'));
                });
                socket.on('error', ({ status }: any) => {
                    expect(status).to.equal(400);
                    socket.disconnect();
                    resolve();
                });
                socket.emit('diceRequest', data);
            });
        }
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
            const socket = await Sockets.connect();
            await new Promise<void>((resolve, reject) => {
                socket.on('diceResult', () => {
                    socket.disconnect();
                    resolve();
                });
                socket.on('error', (err: any) => {
                    socket.disconnect();
                    reject(err);
                });
                socket.emit('diceRequest', data);
            });
        }
    });

    it('Should send dice roll result to all players in session', async () => {
        const [masterEmail, player1Email, player2Email] = [
            'am.jopek@test.com',
            'd.cascarino@test.com',
            'test@test.com'
        ];
        const [masterToken, player1Token, player2Token] = (
            await Promise.all(
                [masterEmail, player1Email, player2Email].map((email) => (
                    Api.login({
                        email,
                        password: 'test'
                    })
                ))
            )
        );
        const sessionId = sessionsData.find(({ masterId }) => (
            masterToken.userId === masterId
        ))?.id;
        const [masterSocket, player1Socket, player2Socket] = (
            await Promise.all([
                Sockets.connect({
                    bearer: masterToken.bearer ?? '',
                    sessionId
                }),
                ...[player1Token, player2Token].map(({ bearer, userId }) => (
                    Sockets.connect({
                        bearer: bearer ?? '',
                        sessionId,
                        characterId: charactersData.find((character) => (
                            character.userId === userId
                        ))?.id
                    })
                ))
            ])
        );
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

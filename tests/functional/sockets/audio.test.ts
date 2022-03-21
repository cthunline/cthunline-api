import { expect } from 'chai';

import Data from '../helpers/data.helper';
import Sockets from '../helpers/sockets.helper';

import { assertUser, assertAsset } from '../helpers/assert.helper';
import assetsData from '../data/assets.json';

const audioAsset = assetsData.find(({ type }) => (
    type === 'audio'
));

const imageAsset = assetsData.find(({ type }) => (
    type === 'image'
));

describe('[Sockets] Audio', () => {
    before(async () => {
        await Data.reset();
    });

    it('Should fail to play audio because of invalid data', async () => {
        await Sockets.testError(
            'audioPlay',
            'audioPlay',
            [
                {},
                undefined,
                { assetId: audioAsset?.id, invalidKey: 'value' },
                { assetId: 'invalidId', time: 1234 },
                { assetId: 'invalidId' },
                { assetId: imageAsset?.id }
            ],
            400,
            true
        );
    });

    it('Should fail to play or stop audio because not game master', async () => {
        for (const event of ['audioPlay', 'audioStop']) {
            await Sockets.testError(
                event,
                event,
                event === 'audioPlay' ? {
                    assetId: audioAsset?.id
                } : undefined,
                403,
                false
            );
        }
    });

    it('Should play or stop audio', async () => {
        for (const event of ['audioPlay', 'audioStop']) {
            const [
                masterSocket,
                player1Socket,
                player2Socket
            ] = await Sockets.setupSession();
            await Promise.all([
                ...[player1Socket, player2Socket].map((socket) => (
                    new Promise<void>((resolve, reject) => {
                        socket.on(event, ({
                            user,
                            isMaster,
                            asset
                        }: any) => {
                            assertUser(user);
                            expect(isMaster).to.be.true;
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
                )),
                (async () => {
                    masterSocket.emit(event, event === 'audioPlay' ? {
                        assetId: audioAsset?.id,
                        time: 1234
                    } : undefined);
                })()
            ]);
        }
    });
});

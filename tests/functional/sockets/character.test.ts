import { expect } from 'chai';

import Data from '../helpers/data.helper';
import Sockets from '../helpers/sockets.helper';

import { assertUser, assertCharacter } from '../helpers/assert.helper';

describe('[Sockets] Character', () => {
    before(async () => {
        await Data.reset();
    });

    it('Should send character update to game master', async () => {
        const [
            masterSocket,
            playerSocket
        ] = await Sockets.setupSession();
        await Promise.all([
            new Promise<void>((resolve, reject) => {
                masterSocket.on('characterUpdate', ({
                    user,
                    isMaster,
                    character
                }: any) => {
                    assertUser(user);
                    expect(isMaster).to.be.false;
                    assertCharacter(character);
                    masterSocket.disconnect();
                    resolve();
                });
                masterSocket.on('error', (err: any) => {
                    masterSocket.disconnect();
                    reject(err);
                });
            }),
            (async () => {
                playerSocket.emit('characterUpdate');
            })()
        ]);
    });
});

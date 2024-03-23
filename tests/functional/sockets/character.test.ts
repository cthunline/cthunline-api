import { describe, expect, test, beforeAll, beforeEach } from 'vitest';

import { resetData, resetCache } from '../helpers/data.helper.js';
import { socketHelper } from '../helpers/sockets.helper.js';

import {
    assertUser,
    assertCharacter,
    assertSocketMeta
} from '../helpers/assert.helper.js';

describe('[Sockets] Character', () => {
    beforeAll(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await resetCache();
    });

    test('Should send character update to game master', async () => {
        const {
            sockets: [masterSocket, playerSocket]
        } = await socketHelper.setupSession();
        await Promise.all([
            new Promise<void>((resolve, reject) => {
                masterSocket.on('characterUpdate', (data: any) => {
                    const { user, isMaster, character } = data;
                    assertSocketMeta(data);
                    assertUser(user);
                    expect(isMaster).toEqual(false);
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

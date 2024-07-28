import { beforeAll, beforeEach, describe, expect, test } from 'vitest';

import type { InstanceStats } from '../../../src/types/stats.js';
import { api } from '../helpers/api.helper.js';
import {
    assertCharacter,
    compareDataWithExpected
} from '../helpers/assert.helper.js';
import {
    findCharacter,
    getUserCharacters
} from '../helpers/character.helper.js';
import {
    charactersData,
    resetCache,
    resetData,
    sessionsData
} from '../helpers/data.helper.js';
import { socketHelper } from '../helpers/sockets.helper.js';
import { getAnotherUser } from '../helpers/user.helper.js';

const checkStats = async (expected: any) => {
    const response = await api.request({
        method: 'GET',
        route: '/statistics'
    });
    expect(response).toHaveStatus(200);
    expect(response.body).to.be.an('object');
    const { body } = response;
    compareDataWithExpected(body, expected);
};

describe('[API] Statistics', () => {
    beforeAll(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await resetCache();
        await api.login();
    });

    describe('GET /stats', () => {
        test('Should get instance statistics', async () => {
            // check default statistics
            const userChars = getUserCharacters(api.userId);
            const expected: InstanceStats = {
                runningSessions: 0,
                totalSessions: sessionsData.length,
                playingUsers: 0,
                userCharacterCount: userChars.length,
                totalCharacterCount: charactersData.length
            };
            await checkStats(expected);
            // creates characters
            const gameId = 'callOfCthulhu';
            const { data } = findCharacter(api.userId, gameId);
            const otherUser = getAnotherUser(api.userId);
            const userIds = [api.userId, otherUser.id];
            for (const userId of userIds) {
                const createResponse = await api.request({
                    method: 'POST',
                    route: '/characters',
                    body: {
                        gameId,
                        name: `Test ${gameId}`,
                        data
                    }
                });
                expect(createResponse).toHaveStatus(200);
                assertCharacter(createResponse.body);
                if (userId !== api.userId) {
                    const transferResponse = await api.request({
                        method: 'PUT',
                        route: `/characters/${createResponse.body.id}/transfer/${userId}`
                    });
                    expect(transferResponse).toHaveStatus(200);
                }
            }
            // checks stats with created characters
            expected.totalCharacterCount += 2;
            expected.userCharacterCount += 1;
            await checkStats(expected);
            // creates play session
            const { sockets } = await socketHelper.setupSession();
            // checks stats with play session
            expected.runningSessions = 1;
            expected.playingUsers = sockets.length;
            await checkStats(expected);
            // disconnect sockets
            for (const socket of sockets) {
                socket.disconnect();
            }
        });
    });
});

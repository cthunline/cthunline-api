import { afterEach, beforeAll, beforeEach, describe, test } from 'vitest';

import { gamesData } from '../../../src/services/games.js';
import { api } from '../helpers/api.helper.js';
import { assertGame } from '../helpers/assert.helper.js';
import { resetCache, resetData } from '../helpers/data.helper.js';

const games = Object.values(gamesData);

describe('[API] Games', () => {
    beforeAll(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await resetCache();
        await api.login();
    });
    afterEach(async () => {
        await api.logout();
    });

    describe('GET /games', () => {
        test('Should list all games', async () => {
            await api.testGetList({
                route: '/games',
                listKey: 'games',
                data: games,
                assert: assertGame
            });
        });
    });

    describe('GET /games/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'GET',
                route: '/games/:id',
                isInteger: false
            });
        });
        test('Should get a game', async () => {
            await api.testGetOne({
                route: '/games/:id',
                data: games[0],
                assert: assertGame
            });
        });
    });
});

import { describe, test, beforeAll, beforeEach, afterEach } from 'vitest';

import { assertGame } from '../helpers/assert.helper.js';
import { resetData } from '../helpers/data.helper.js';
import { api } from '../helpers/api.helper.js';

import { GamesData } from '../../../src/services/games.js';

const games = Object.values(GamesData);

describe('[API] Games', () => {
    beforeAll(async () => {
        await resetData();
    });
    beforeEach(async () => {
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

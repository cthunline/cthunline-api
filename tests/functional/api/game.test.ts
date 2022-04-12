import Api from '../helpers/api.helper';
import Data from '../helpers/data.helper';
import { assertGame } from '../helpers/assert.helper';

import { GamesData } from '../../../src/games';

const games = Object.values(GamesData);

describe('[API] Games', () => {
    before(async () => {
        await Data.reset();
    });
    beforeEach(async () => {
        await Api.login();
    });
    afterEach(async () => {
        await Api.logout();
    });

    describe('GET /games', () => {
        it('Should list all games', async () => {
            await Api.testGetList({
                route: '/games',
                listKey: 'games',
                data: games,
                assert: assertGame
            });
        });
    });

    describe('GET /games/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: '/games/:id',
                isObjectId: false
            });
        });
        it('Should get a game', async () => {
            await Api.testGetOne({
                route: '/games/:id',
                data: games[0],
                assert: assertGame
            });
        });
    });
});

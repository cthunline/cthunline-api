import { expect } from 'chai';
import Api from '../helpers/api.helper';
import Data from '../helpers/data.helper';
import { assertGame } from '../helpers/assert.helper';
import gamesData from '../data/games.json';

describe('[Functional] Games', () => {
    beforeEach(async () => {
        await Data.reset();
        await Api.login();
    });

    describe('GET /games', () => {
        it('Should list all games', async () => {
            await Api.testGetList({
                route: '/games',
                listKey: 'games',
                data: gamesData,
                assert: assertGame
            });
        });
    });

    describe('POST /games', () => {
        it('Should throw a validation error', async () => {
            await Api.testValidationError({
                route: '/games',
                data: [{
                    invalidProperty: 'Test'
                }, {
                    name: 'Test',
                    invalidProperty: 'Test'
                }, {}]
            });
        });
        it('Should create a game', async () => {
            await Api.testCreate({
                route: '/games',
                data: {
                    name: 'Test'
                },
                assert: assertGame
            });
        });
    });

    describe('GET /games/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: '/games/:id'
            });
        });
        it('Should get a game', async () => {
            await Api.testGetOne({
                route: '/games/:id',
                data: gamesData[0],
                assert: assertGame
            });
        });
    });

    describe('POST /games/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'POST',
                route: '/games/:id',
                body: {
                    name: 'Test'
                }
            });
        });
        it('Should throw a validation error', async () => {
            const response = await Api.request({
                method: 'POST',
                route: '/games',
                body: {
                    name: 'Test'
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.testValidationError({
                route: `/games/${id}`,
                data: [{
                    invalidProperty: 'Test'
                }, {
                    name: 'Test',
                    invalidProperty: 'Test'
                }, {}]
            });
        });
        it('Should edit a game', async () => {
            const response = await Api.request({
                method: 'POST',
                route: '/games',
                body: {
                    name: 'Test'
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.testEdit({
                route: `/games/${id}`,
                data: {
                    name: 'Test1'
                },
                assert: assertGame
            });
        });
    });
});

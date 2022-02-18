import { expect } from 'chai';

import Api from '../../helpers/api.helper';
import Data from '../../helpers/data.helper';
import { assertSession } from '../../helpers/assert.helper';

import sessionsData from '../../data/sessions.json';

const { gameId } = sessionsData[0];

describe('[API] Sessions', () => {
    beforeEach(async () => {
        await Data.reset();
        await Api.login();
    });

    describe('GET /sessions', () => {
        it('Should list all sessions', async () => {
            await Api.testGetList({
                route: '/sessions',
                listKey: 'sessions',
                data: sessionsData,
                assert: assertSession
            });
        });
    });

    describe('POST /sessions', () => {
        it('Should throw a validation error', async () => {
            await Api.testValidationError({
                route: '/sessions',
                data: [{
                    invalidProperty: 'Test'
                }, {
                    name: 'Test',
                    sketch: {},
                    invalidProperty: 'Test'
                }, {}]
            });
        });
        it('Should create a session', async () => {
            await Api.testCreate({
                route: '/sessions',
                data: {
                    gameId,
                    name: 'Test'
                },
                assert: assertSession
            });
            const { sketch } = sessionsData[0];
            await Api.testCreate({
                route: '/sessions',
                data: {
                    gameId,
                    name: 'Test',
                    sketch
                },
                assert: assertSession
            });
        });
    });

    describe('GET /sessions/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: '/sessions/:id'
            });
        });
        it('Should get a session', async () => {
            await Api.testGetOne({
                route: '/sessions/:id',
                data: sessionsData[0],
                assert: assertSession
            });
        });
    });

    describe('POST /sessions/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'POST',
                route: '/sessions/:id',
                body: {
                    name: 'Test'
                }
            });
        });
        it('Should throw a validation error', async () => {
            const response = await Api.request({
                method: 'POST',
                route: '/sessions',
                body: {
                    gameId,
                    name: 'Test'
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.testValidationError({
                route: `/sessions/${id}`,
                data: [{
                    invalidProperty: 'Test'
                }, {
                    name: 'Test',
                    sketch: {},
                    invalidProperty: 'Test'
                }, {}]
            });
        });
        it('Should edit a session', async () => {
            const response = await Api.request({
                method: 'POST',
                route: '/sessions',
                body: {
                    gameId,
                    name: 'Test'
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.testEdit({
                route: `/sessions/${id}`,
                data: {
                    name: 'Test1'
                },
                assert: assertSession
            });
            const { sketch } = sessionsData[1];
            await Api.testEdit({
                route: `/sessions/${id}`,
                data: {
                    name: 'Test2',
                    sketch
                },
                assert: assertSession
            });
        });
    });

    describe('DELETE /sessions/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'DELETE',
                route: '/sessions/:id'
            });
        });
        it('Should delete a session', async () => {
            const response = await Api.request({
                method: 'POST',
                route: '/sessions',
                body: {
                    gameId,
                    name: 'Test'
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.testDelete({
                route: `/sessions/${id}`,
                testGet: true
            });
        });
    });
});

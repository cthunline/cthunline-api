import { expect } from 'chai';

import { assertSession, assertUser } from '../helpers/assert.helper.js';
import { sessionsData, resetData } from '../helpers/data.helper.js';
import { api } from '../helpers/api.helper.js';

const { gameId } = sessionsData[0];

describe('[API] Sessions', () => {
    before(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await api.login();
    });
    afterEach(async () => {
        await api.logout();
    });

    describe('GET /sessions', () => {
        it('Should list all sessions', async () => {
            await api.testGetList({
                route: '/sessions',
                listKey: 'sessions',
                data: sessionsData,
                assert: assertSession
            });
        });
        it('Should list all sessions including master data', async () => {
            await api.testGetList({
                route: '/sessions?include=true',
                listKey: 'sessions',
                data: sessionsData,
                assert: (data: any) => {
                    assertSession(data);
                    assertUser(data.master);
                }
            });
        });
    });

    describe('POST /sessions', () => {
        it('Should throw a validation error', async () => {
            const invalidData = [
                {
                    invalidProperty: 'Test'
                },
                {
                    name: 'Test',
                    sketch: {},
                    invalidProperty: 'Test'
                },
                {}
            ];
            for (const body of invalidData) {
                await api.testError(
                    {
                        method: 'POST',
                        route: '/sessions',
                        body
                    },
                    400
                );
            }
        });
        it('Should create a session', async () => {
            await api.testCreate({
                route: '/sessions',
                data: {
                    gameId,
                    name: 'Test'
                },
                assert: assertSession
            });
            const { sketch } = sessionsData[0];
            await api.testCreate({
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
            await api.testInvalidIdError({
                method: 'GET',
                route: '/sessions/:id'
            });
        });
        it('Should get a session', async () => {
            await api.testGetOne({
                route: '/sessions/:id',
                data: sessionsData[0],
                assert: assertSession
            });
        });
    });

    describe('POST /sessions/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'POST',
                route: '/sessions/:id',
                body: {
                    name: 'Test'
                }
            });
        });
        it('Should throw a validation error', async () => {
            const response = await api.request({
                method: 'POST',
                route: '/sessions',
                body: {
                    gameId,
                    name: 'Test'
                }
            });
            expect(response).to.have.status(200);
            const {
                body: { id }
            } = response;
            const invalidData = [
                {
                    invalidProperty: 'Test'
                },
                {
                    name: 'Test',
                    sketch: {},
                    invalidProperty: 'Test'
                },
                {}
            ];
            for (const body of invalidData) {
                await api.testError(
                    {
                        method: 'POST',
                        route: `/sessions/${id}`,
                        body
                    },
                    400
                );
            }
        });
        it('Should throw a forbidden error', async () => {
            await api.testError(
                {
                    method: 'POST',
                    route: `/sessions/${sessionsData[1].id}`,
                    body: {
                        name: 'Test11'
                    }
                },
                403
            );
        });
        it('Should edit a session', async () => {
            const response = await api.request({
                method: 'POST',
                route: '/sessions',
                body: {
                    gameId,
                    name: 'Test'
                }
            });
            expect(response).to.have.status(200);
            const {
                body: { id }
            } = response;
            await api.testEdit({
                route: `/sessions/${id}`,
                data: {
                    name: 'Test1'
                },
                assert: assertSession
            });
            const { sketch } = sessionsData[1];
            await api.testEdit({
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
            await api.testInvalidIdError({
                method: 'DELETE',
                route: '/sessions/:id'
            });
        });
        it('Should throw a forbidden error', async () => {
            await api.testError(
                {
                    method: 'DELETE',
                    route: `/sessions/${sessionsData[1].id}`
                },
                403
            );
        });
        it('Should delete a session', async () => {
            const response = await api.request({
                method: 'POST',
                route: '/sessions',
                body: {
                    gameId,
                    name: 'Test'
                }
            });
            expect(response).to.have.status(200);
            const {
                body: { id }
            } = response;
            await api.testDelete({
                route: `/sessions/${id}`,
                testGet: true
            });
        });
    });
});

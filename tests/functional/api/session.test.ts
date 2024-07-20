import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test
} from 'vitest';

import { api } from '../helpers/api.helper.js';
import { assertSession, assertUser } from '../helpers/assert.helper.js';
import { resetCache, resetData, sessionsData } from '../helpers/data.helper.js';

const { gameId } = sessionsData[0];

describe('[API] Sessions', () => {
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

    describe('GET /sessions', () => {
        test('Should list all sessions', async () => {
            await api.testGetList({
                route: '/sessions',
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
        test('Should throw a validation error', async () => {
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
        test('Should create a session', async () => {
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
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'GET',
                route: '/sessions/:id'
            });
        });
        test('Should get a session', async () => {
            await api.testGetOne({
                route: '/sessions/:id',
                data: sessionsData[0],
                assert: assertSession
            });
        });
    });

    describe('PATCH /sessions/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'PATCH',
                route: '/sessions/:id',
                body: {
                    name: 'Test'
                }
            });
        });
        test('Should throw a validation error', async () => {
            const response = await api.request({
                method: 'POST',
                route: '/sessions',
                body: {
                    gameId,
                    name: 'Test'
                }
            });
            expect(response).toHaveStatus(200);
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
                        method: 'PATCH',
                        route: `/sessions/${id}`,
                        body
                    },
                    400
                );
            }
        });
        test('Should throw a forbidden error', async () => {
            await api.testError(
                {
                    method: 'PATCH',
                    route: `/sessions/${sessionsData[1].id}`,
                    body: {
                        name: 'Test11'
                    }
                },
                403
            );
        });
        test('Should edit a session', async () => {
            const response = await api.request({
                method: 'POST',
                route: '/sessions',
                body: {
                    gameId,
                    name: 'Test'
                }
            });
            expect(response).toHaveStatus(200);
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
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'DELETE',
                route: '/sessions/:id'
            });
        });
        test('Should throw a forbidden error', async () => {
            await api.testError(
                {
                    method: 'DELETE',
                    route: `/sessions/${sessionsData[1].id}`
                },
                403
            );
        });
        test('Should delete a session', async () => {
            const response = await api.request({
                method: 'POST',
                route: '/sessions',
                body: {
                    gameId,
                    name: 'Test'
                }
            });
            expect(response).toHaveStatus(200);
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

import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test
} from 'vitest';

import { api } from '../helpers/api.helper.js';
import { assertSketch } from '../helpers/assert.helper.js';
import {
    resetCache,
    resetData,
    sessionsData,
    sketchsData
} from '../helpers/data.helper.js';

const getUserSessionSketchs = (userId: number, sessionId: number) =>
    sketchsData.filter(
        ({ userId: sketchUserId, sessionId: sketchSessionId }) =>
            sketchUserId === userId && sketchSessionId === sessionId
    );

const getUserSketch = (userId: number) => {
    const sketch = sketchsData.find(
        ({ userId: sketchUserId }) => sketchUserId === userId
    );
    if (!sketch) {
        throw new Error('Could not find sketch to run test');
    }
    return sketch;
};

const getAnotherUserSketch = (userId: number) => {
    const sketch = sketchsData.find(
        ({ userId: sketchUserId }) => sketchUserId !== userId
    );
    if (!sketch) {
        throw new Error('Could not find sketch to run test');
    }
    return sketch;
};

const getNonGMSession = (userId: number) => {
    const session = sessionsData.find(({ masterId }) => masterId !== userId);
    if (!session) {
        throw new Error('Could not find a non-GM session to run test');
    }
    return session;
};

describe('[API] Sketchs', () => {
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

    describe('GET /sessions/:sessionId/sketchs', () => {
        test('Should list all sketchs of the current user in the given session', async () => {
            const { sessionId } = getUserSketch(api.userId);
            await api.testGetList({
                route: `/sessions/${sessionId}/sketchs`,
                listKey: 'sketchs',
                data: getUserSessionSketchs(api.userId, sessionId),
                assert: assertSketch
            });
        });
    });

    describe('POST /sessions/:sessionId/sketchs', () => {
        test('Should throw error because of invalid ID', async () => {
            const { data } = sketchsData[0];
            await api.testInvalidIdError({
                method: 'POST',
                route: '/sessions/:id/sketchs',
                body: {
                    name: 'Test',
                    data
                }
            });
        });
        test('Should throw a forbidden because user is not game master in session', async () => {
            const session = getNonGMSession(api.userId);
            const { data } = sketchsData[0];
            await api.testError(
                {
                    method: 'POST',
                    route: `/sessions/${session.id}/sketchs`,
                    body: {
                        name: 'Test',
                        data
                    }
                },
                403
            );
        });
        test('Should throw a validation error', async () => {
            const { sessionId } = getUserSketch(api.userId);
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
                        route: `/sessions/${sessionId}/sketchs`,
                        body
                    },
                    400
                );
            }
        });
        test('Should save a sketch for the current user and the given session', async () => {
            const { sessionId } = getUserSketch(api.userId);
            const { data } = sketchsData[0];
            await api.testCreate({
                route: `/sessions/${sessionId}/sketchs`,
                getRoute: '/sketchs/:id',
                data: {
                    name: 'Test',
                    data
                },
                assert: assertSketch
            });
        });
    });

    describe('GET /sketchs/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'GET',
                route: '/sketchs/:id'
            });
        });
        test('Should get a sketch belonging to the current user', async () => {
            await api.testGetOne({
                route: '/sketchs/:id',
                data: sketchsData[0],
                assert: assertSketch
            });
        });
    });

    describe('PATCH /sketchs/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'PATCH',
                route: '/sketchs/:id',
                body: {
                    name: 'test'
                }
            });
        });
        test('Should throw a forbidden error because sketch belongs to another user', async () => {
            const anotherUserSketch = getAnotherUserSketch(api.userId);
            await api.testError(
                {
                    method: 'PATCH',
                    route: `/sketchs/${anotherUserSketch.id}`,
                    body: { name: 'test' }
                },
                403
            );
        });
        test('Should throw a validation error', async () => {
            const sketch = getUserSketch(api.userId);
            const invalidData = [
                {
                    invalidProperty: 'Test'
                },
                {
                    name: 'Test',
                    invalidProperty: 'Test'
                },
                {
                    name: 1234
                },
                {
                    data: {
                        invalidProperty: 'test'
                    }
                },
                {}
            ];
            for (const body of invalidData) {
                await api.testError(
                    {
                        method: 'PATCH',
                        route: `/sketchs/${sketch.id}`,
                        body
                    },
                    400
                );
            }
        });
        test('Should update a sketch belonging to the current user', async () => {
            const userSketch = getUserSketch(api.userId);
            const anotherUserSketch = getAnotherUserSketch(api.userId);
            const response = await api.request({
                method: 'POST',
                route: `/sessions/${userSketch.sessionId}/sketchs`,
                body: {
                    name: userSketch.name,
                    data: userSketch.data
                }
            });
            expect(response).toHaveStatus(200);
            const {
                body: { id }
            } = response;
            await api.testEdit({
                route: `/sketchs/${id}`,
                data: {
                    name: anotherUserSketch.name,
                    data: anotherUserSketch.data
                },
                assert: assertSketch
            });
        });
    });

    describe('DELETE /sketchs/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'DELETE',
                route: '/sketchs/:id'
            });
        });
        test('Should delete a sketch belonging to the current user', async () => {
            const { sessionId, data } = sketchsData[0];
            const response = await api.request({
                method: 'POST',
                route: `/sessions/${sessionId}/sketchs`,
                body: {
                    name: 'Test',
                    data
                }
            });
            expect(response).toHaveStatus(200);
            const {
                body: { id }
            } = response;
            await api.testDelete({
                route: `/sketchs/${id}`,
                testGet: true
            });
        });
    });
});

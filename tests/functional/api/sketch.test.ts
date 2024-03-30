import {
    describe,
    expect,
    test,
    beforeAll,
    beforeEach,
    afterEach
} from 'vitest';

import { sketchsData, resetData, resetCache } from '../helpers/data.helper.js';
import { assertSketch } from '../helpers/assert.helper.js';
import { api } from '../helpers/api.helper.js';

const getUserSketchs = (userId: number) =>
    sketchsData.filter(({ userId: sketchUserId }) => sketchUserId === userId);

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

    describe('GET /sketchs', () => {
        test('Should list all sketchs of the current user', async () => {
            await api.testGetList({
                route: '/sketchs',
                listKey: 'sketchs',
                data: getUserSketchs(api.userId),
                assert: assertSketch
            });
        });
    });

    describe('POST /sketchs', () => {
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
                        route: '/sketchs',
                        body
                    },
                    400
                );
            }
        });
        test('Should save a sketch for the current user', async () => {
            const { data } = sketchsData[0];
            await api.testCreate({
                route: '/sketchs',
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

    describe('POST /sketchs/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'POST',
                route: '/sketchs/:id',
                body: {
                    name: 'test'
                }
            });
        });
        test('Should throw a not found error because sketch belong to another user', async () => {
            const anotherUserSketch = getAnotherUserSketch(api.userId);
            await api.testError(
                {
                    method: 'POST',
                    route: `/sketchs/${anotherUserSketch.id}`,
                    body: { name: 'test' }
                },
                404
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
                        method: 'POST',
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
                route: '/sketchs',
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
            const { data } = sketchsData[0];
            const response = await api.request({
                method: 'POST',
                route: '/sketchs',
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

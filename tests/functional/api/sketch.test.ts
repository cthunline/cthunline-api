import {
    describe,
    expect,
    test,
    beforeAll,
    beforeEach,
    afterEach
} from 'vitest';

import { sketchsData, resetData, resetCache } from '../helpers/data.helper.js';
import { assertSketchObject } from '../helpers/assert.helper.js';
import { api } from '../helpers/api.helper.js';

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
                data: sketchsData.filter(({ userId }) => api.userId === userId),
                assert: assertSketchObject
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
            const { sketch } = sketchsData[0];
            await api.testCreate({
                route: '/sketchs',
                data: {
                    name: 'Test',
                    sketch
                },
                assert: assertSketchObject
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
                assert: assertSketchObject
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
            const { sketch } = sketchsData[0];
            const response = await api.request({
                method: 'POST',
                route: '/sketchs',
                body: {
                    name: 'Test',
                    sketch
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

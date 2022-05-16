import { expect } from 'chai';

import Api from '../helpers/api.helper';
import Data, { sketchsData } from '../helpers/data.helper';
import { assertSketchObject } from '../helpers/assert.helper';

describe('[API] Sketchs', () => {
    before(async () => {
        await Data.reset();
    });
    beforeEach(async () => {
        await Api.login();
    });
    afterEach(async () => {
        await Api.logout();
    });

    describe('GET /sketchs', () => {
        it('Should list all sketchs of the current user', async () => {
            await Api.testGetList({
                route: '/sketchs',
                listKey: 'sketchs',
                data: sketchsData.filter(({ userId }) => (
                    Api.userId === userId
                )),
                assert: assertSketchObject
            });
        });
    });

    describe('POST /sketchs', () => {
        it('Should throw a validation error', async () => {
            const invalidData = [{
                invalidProperty: 'Test'
            }, {
                name: 'Test',
                sketch: {},
                invalidProperty: 'Test'
            }, {}];
            await Promise.all(
                invalidData.map((body) => (
                    Api.testError({
                        method: 'POST',
                        route: '/sketchs',
                        body
                    }, 400)
                ))
            );
        });
        it('Should save a sketch for the current user', async () => {
            const { sketch } = sketchsData[0];
            await Api.testCreate({
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
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: '/sketchs/:id'
            });
        });
        it('Should get a sketch belonging to the current user', async () => {
            await Api.testGetOne({
                route: '/sketchs/:id',
                data: sketchsData[0],
                assert: assertSketchObject
            });
        });
    });

    describe('DELETE /sketchs/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'DELETE',
                route: '/sketchs/:id'
            });
        });
        it('Should delete a sketch belonging to the current user', async () => {
            const { sketch } = sketchsData[0];
            const response = await Api.request({
                method: 'POST',
                route: '/sketchs',
                body: {
                    name: 'Test',
                    sketch
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.testDelete({
                route: `/sketchs/${id}`,
                testGet: true
            });
        });
    });
});

// import { expect } from 'chai';
import Path from 'path';

import Api from '../../helpers/api.helper';
import Data from '../../helpers/data.helper';
import { assertAsset } from '../../helpers/assert.helper';

import assetsData from '../../data/assets.json';

const { userId } = assetsData[0];

describe('[API] Assets', () => {
    beforeEach(async () => {
        await Data.reset();
        await Api.login();
    });

    describe('GET /users/:id/assets', () => {
        it('Should list all assets', async () => {
            await Api.testGetList({
                route: `/users/${userId}/assets`,
                listKey: 'assets',
                data: assetsData,
                assert: assertAsset
            });
            await Promise.all(
                assetsData.map(({ path }) => (
                    Api.testStaticFile(
                        Path.join('/static', path)
                    )
                ))
            );
        });
    });

    describe('POST /users/:id/assets', () => {
        // TODO use FormDatas
        // it('Should throw a validation error', async () => {
        //     await Api.testValidationError({
        //         route: `/users/${userId}/assets`,
        //         data: [{
        //             invalidProperty: 'Test'
        //         }, {
        //             invalidData: 'here'
        //         }, {
        //             invalidData: 'here'
        //         }, {}]
        //     });
        // });
        // it('Should create an asset', async () => {
        //     await Api.testCreate({
        //         route: `/users/${userId}/assets`,
        //         data: {
        //             name: 'Test',
        //             email: 'bbb@test.com',
        //             password: 'abc123'
        //         },
        //         assert: assertAsset
        //     });
        // });
    });

    describe('GET /users/:id/assets/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: `/users/${userId}/assets/:id`
            });
        });
        it('Should get an asset', async () => {
            await Promise.all([
                Api.testGetOne({
                    route: `/users/${userId}/assets/:id`,
                    data: assetsData[0],
                    assert: assertAsset
                }),
                Api.testStaticFile(
                    Path.join('/static', assetsData[0].path)
                )
            ]);
        });
    });

    describe('DELETE /users/:id/assets/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'DELETE',
                route: `/users/${userId}/assets/:id`
            });
        });
        it('Should delete an asset', async () => {
            // TODO use FormData
            // const response = await Api.request({
            //     method: 'POST',
            //     route: `/users/${userId}/assets`,
            //     body: {
            //         data: 'here'
            //     }
            // });
            // expect(response).to.have.status(200);
            // const { body: { id } } = response;
            // await Api.testDelete({
            //     route: `/users/${userId}/assets/${id}`,
            //     testGet: true
            // });
        });
    });
});

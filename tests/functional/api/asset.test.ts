import { expect } from 'chai';
import Fs from 'fs';
import Path from 'path';

import Api from '../../helpers/api.helper';
import Data from '../../helpers/data.helper';
import { assertAsset, assertError } from '../../helpers/assert.helper';

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
        it('Should throw a validation error', async () => {
            await Promise.all(
                ['asset.pdf', 'asset.ico'].map((name) => (
                    (async () => {
                        const localPath = Path.join(
                            __dirname,
                            '../../data/assets',
                            name
                        );
                        const buffer = await Fs.promises.readFile(localPath);
                        const response = await Api.request({
                            method: 'POST',
                            route: `/users/${userId}/assets`,
                            files: [{
                                field: 'asset',
                                buffer,
                                name
                            }]
                        });
                        expect(response).to.have.status(400);
                        expect(response).to.be.json;
                        assertError(response.body);
                    })()
                ))
            );
        });
        it('Should upload an asset', async () => {
            const assetNames = [
                'asset.mp3',
                'asset.jpg',
                'asset.png',
                'asset.svg'
            ];
            for (const name of assetNames) {
                const localPath = Path.join(
                    __dirname,
                    '../../data/assets',
                    name
                );
                const buffer = await Fs.promises.readFile(localPath);
                const response = await Api.request({
                    method: 'POST',
                    route: `/users/${userId}/assets`,
                    files: [{
                        field: 'asset',
                        buffer,
                        name
                    }]
                });
                expect(response).to.have.status(200);
                expect(response).to.be.json;
                assertAsset(response.body, {
                    type: name.endsWith('mp3') ? 'audio' : 'image',
                    name,
                    userId
                });
                const { path } = response.body;
                await Api.testStaticFile(
                    Path.join('/static', path)
                );
            }
        });
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
            await Api.testDelete({
                route: `/users/${userId}/assets/${assetsData[2].id}`,
                testGet: true
            });
        });
    });
});

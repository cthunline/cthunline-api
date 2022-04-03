import { expect } from 'chai';
import Fs from 'fs';
import Path from 'path';

import Api from '../helpers/api.helper';
import Data, {
    assetsData,
    usersData
} from '../helpers/data.helper';
import { assertAsset } from '../helpers/assert.helper';

const getAssetBuffer = async (assetName: string) => {
    const localPath = Path.join(
        __dirname,
        '../data/assets',
        assetName
    );
    return Fs.promises.readFile(localPath);
};

const { userId } = assetsData[0];

describe('[API] Assets', () => {
    before(async () => {
        await Data.reset();
    });
    beforeEach(async () => {
        await Api.login();
    });

    describe('GET /users/:id/assets', () => {
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'GET',
                route: `/users/${usersData[0].id}/assets`
            }, 403);
        });
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
                        const buffer = await getAssetBuffer(name);
                        await Api.testError({
                            method: 'POST',
                            route: `/users/${userId}/assets`,
                            files: [{
                                field: 'asset',
                                buffer,
                                name
                            }]
                        }, 400);
                    })()
                ))
            );
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'POST',
                route: `/users/${usersData[0].id}/assets`,
                files: [{
                    field: 'asset',
                    buffer: Buffer.from(''),
                    name: ''
                }]
            }, 403);
        });
        it('Should upload an asset', async () => {
            const assetNames = [
                'asset.mp3',
                'asset.jpg',
                'asset.png',
                'asset.svg'
            ];
            for (const name of assetNames) {
                const buffer = await getAssetBuffer(name);
                const response = await Api.request({
                    method: 'POST',
                    route: `/users/${userId}/assets`,
                    files: [{
                        field: 'assets',
                        buffer,
                        name
                    }]
                });
                expect(response).to.have.status(200);
                expect(response).to.be.json;
                const { assets } = response.body;
                expect(assets).to.be.an('array');
                expect(assets).to.have.lengthOf(1);
                assertAsset(assets[0], {
                    type: name.endsWith('mp3') ? 'audio' : 'image',
                    name,
                    userId
                });
                const { path } = assets[0];
                await Api.testStaticFile(
                    Path.join('/static', path)
                );
            }
        });
        it('Should upload multiple assets', async () => {
            const assetNames = [
                'asset.mp3',
                'asset.jpg',
                'asset.png',
                'asset.svg'
            ];
            const files = await Promise.all(
                assetNames.map((name) => (
                    (async () => ({
                        field: 'assets',
                        buffer: await getAssetBuffer(name),
                        name
                    }))()
                ))
            );
            const response = await Api.request({
                method: 'POST',
                route: `/users/${userId}/assets`,
                files
            });
            expect(response).to.have.status(200);
            expect(response).to.be.json;
            const { assets } = response.body;
            expect(assets).to.be.an('array');
            expect(assets).to.have.lengthOf(files.length);
            for (const assetName of assetNames) {
                const asset = assets.find(({ name }: any) => (
                    name === assetName
                ));
                assertAsset(asset, {
                    type: assetName.endsWith('mp3') ? 'audio' : 'image',
                    name: assetName,
                    userId
                });
                await Api.testStaticFile(
                    Path.join('/static', asset.path)
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
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'GET',
                route: `/users/${usersData[0].id}/assets/${assetsData[0].id}`
            }, 403);
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
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'DELETE',
                route: `/users/${usersData[0].id}/assets/${assetsData[0].id}`
            }, 403);
        });
        it('Should delete an asset', async () => {
            await Api.testDelete({
                route: `/users/${userId}/assets/${assetsData[2].id}`,
                testGet: true
            });
        });
    });
});

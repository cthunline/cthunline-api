import { expect } from 'chai';
import Fs from 'fs';
import Path from 'path';

import Api from '../helpers/api.helper';
import Data, {
    assetsData,
    directoriesData,
    usersData
} from '../helpers/data.helper';
import { assertAsset, assertDirectory } from '../helpers/assert.helper';

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
    afterEach(async () => {
        await Api.logout();
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
            const uploadData = [{
                name: 'asset.mp3'
            }, {
                name: 'asset.jpg'
            }, {
                name: 'asset.png',
                directoryId: directoriesData[0].id
            }, {
                name: 'asset.svg',
                directoryId: directoriesData[1].id
            }];
            for (const { name, directoryId } of uploadData) {
                const buffer = await getAssetBuffer(name);
                const response = await Api.request({
                    method: 'POST',
                    route: `/users/${userId}/assets`,
                    files: [{
                        field: 'assets',
                        buffer,
                        name
                    }],
                    fields: directoryId ? {
                        directoryId
                    } : undefined
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

    describe('GET /users/:id/directories', () => {
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'GET',
                route: `/users/${usersData[0].id}/directories`
            }, 403);
        });
        it('Should list all directories', async () => {
            await Api.testGetList({
                route: `/users/${userId}/directories`,
                listKey: 'directories',
                data: directoriesData,
                assert: assertDirectory
            });
        });
    });

    describe('POST /users/:id/directories', () => {
        it('Should throw a validation error', async () => {
            const invalidData = [{
                invalidProperty: 'Test'
            }, {
                parentId: 'abc123'
            }, {
                name: 'Test',
                invalidProperty: 'Test'
            }, {
                name: 'Test',
                parentId: 'abc123',
                invalidProperty: 'Test'
            }, {}];
            for (const body of invalidData) {
                await Api.testError({
                    method: 'POST',
                    route: `/users/${userId}/directories`,
                    body
                }, 400);
            }
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'POST',
                route: `/users/${usersData[0].id}/directories`,
                body: {
                    name: 'Test'
                }
            }, 403);
        });
        it('Should create a directory', async () => {
            const createData = [{
                name: 'Test'
            }, {
                name: 'Subtest',
                parentId: directoriesData[0].id
            }];
            for (const data of createData) {
                await Api.testCreate({
                    route: `/users/${userId}/directories`,
                    data,
                    assert: assertDirectory
                });
            }
        });
    });

    describe('GET /users/:id/directories/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: `/users/${userId}/directories/:id`
            });
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'GET',
                route: `/users/${usersData[0].id}/directories/${directoriesData[0].id}`
            }, 403);
        });
        it('Should get an directory', async () => {
            await Api.testGetOne({
                route: `/users/${userId}/directories/:id`,
                data: directoriesData[0],
                assert: assertDirectory
            });
        });
    });

    describe('POST /users/:id/directories/:id', () => {
        it('Should throw a validation error', async () => {
            const invalidData = [{
                invalidProperty: 'Test'
            }, {
                name: 'Test',
                invalidProperty: 'Test'
            }, {
                name: 'Test',
                parentId: 'abc123'
            }, {}];
            for (const body of invalidData) {
                await Api.testError({
                    method: 'POST',
                    route: `/users/${userId}/directories/${directoriesData[0].id}`,
                    body
                }, 400);
            }
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'POST',
                route: `/users/${usersData[0].id}/directories/${directoriesData[0].id}`,
                body: {
                    name: 'Test'
                }
            }, 403);
        });
        it('Should edit a directory', async () => {
            const response = await Api.request({
                method: 'POST',
                route: `/users/${userId}/directories`,
                body: {
                    name: 'Test'
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.testEdit({
                route: `/users/${userId}/directories/${id}`,
                data: {
                    name: 'Test1'
                },
                assert: assertDirectory
            });
        });
    });

    describe('DELETE /users/:id/directories/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'DELETE',
                route: `/users/${userId}/directories/:id`
            });
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'DELETE',
                route: `/users/${usersData[0].id}/directories/${directoriesData[0].id}`
            }, 403);
        });
        it('Should delete an directory', async () => {
            // create a directory
            const dirResponse = await Api.request({
                method: 'POST',
                route: `/users/${userId}/directories`,
                body: {
                    name: 'Test'
                }
            });
            expect(dirResponse).to.have.status(200);
            const directory = dirResponse.body;
            // create a subdirectory
            const subdirResponse = await Api.request({
                method: 'POST',
                route: `/users/${userId}/directories`,
                body: {
                    name: 'Test',
                    parentId: directory.id
                }
            });
            expect(subdirResponse).to.have.status(200);
            const subDirectory = subdirResponse.body;
            // upload asset in subdirectory
            const buffer = await getAssetBuffer('asset.png');
            const response = await Api.request({
                method: 'POST',
                route: `/users/${userId}/assets`,
                files: [{
                    field: 'assets',
                    buffer,
                    name: 'asset.png'
                }],
                fields: {
                    directoryId: subDirectory.id
                }
            });
            expect(response).to.have.status(200);
            const { assets } = response.body;
            const asset = assets[0];
            // delete main directory
            await Api.testDelete({
                route: `/users/${userId}/directories/${directory.id}`,
                testGet: true
            });
            // check subdirectory and asset have also been deleted
            await Api.testError({
                method: 'GET',
                route: `/users/${userId}/directories/${subDirectory.id}`
            }, 404);
            await Api.testError({
                method: 'GET',
                route: `/users/${userId}/assets/${asset.id}`
            }, 404);
        });
    });
});

import { expect } from 'chai';
import Path from 'path';

import Api from '../helpers/api.helper';
import Data, { assetsData, directoriesData } from '../helpers/data.helper';
import { assertAsset, assertDirectory } from '../helpers/assert.helper';

const { userId } = assetsData[0];
const userAssets = assetsData.filter(({ userId: assetUserId }) => (
    assetUserId === userId
));
const forbiddenAsset = assetsData.find(({ userId: assetUserId }) => (
    assetUserId !== userId
));
const userDirectories = directoriesData.filter(({ userId: assetUserId }) => (
    assetUserId === userId
));
const forbiddenDirectory = directoriesData.find(({ userId: dirUserId }) => (
    dirUserId !== userId
));

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

    describe('GET /assets', () => {
        it('Should list all assets', async () => {
            await Api.testGetList({
                route: '/assets',
                listKey: 'assets',
                data: userAssets,
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
        it('Should list all assets including directory data', async () => {
            await Api.testGetList({
                route: '/assets?include=true',
                listKey: 'assets',
                data: userAssets,
                assert: (data: any) => {
                    assertAsset(data);
                    if (data.directoryId) {
                        assertDirectory(data.directory);
                    } else {
                        expect(data.directory).to.be.null;
                    }
                }
            });
        });
    });

    describe('POST /assets', () => {
        it('Should throw a validation error because of wrong file type', async () => {
            await Promise.all(
                ['asset.pdf', 'asset.ico'].map((name) => (
                    (async () => {
                        const buffer = await Data.getAssetBuffer(name);
                        await Api.testError({
                            method: 'POST',
                            route: '/assets',
                            files: [{
                                field: 'assets',
                                buffer,
                                name
                            }]
                        }, 400);
                    })()
                ))
            );
        });
        it('Should throw a validation error because uploaded file is too big', async () => {
            const name = 'too-big.png';
            const buffer = await Data.getAssetBuffer(name);
            await Api.testError({
                method: 'POST',
                route: '/assets',
                files: [{
                    field: 'assets',
                    buffer,
                    name
                }]
            }, 400);
        });
        it('Should throw a validation error because payload is too big', async () => {
            const name = 'big.jpg';
            const buffer = await Data.getAssetBuffer(name);
            const files = [];
            for (let i = 0; i < 10; i += 1) {
                files.push({
                    field: 'assets',
                    buffer,
                    name: `${name}-${i}`
                });
            }
            await Api.testError({
                method: 'POST',
                route: '/assets',
                files
            }, 400);
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
            await Promise.all(
                uploadData.map(({ name, directoryId }) => (
                    (async () => {
                        const buffer = await Data.getAssetBuffer(name);
                        const response = await Api.request({
                            method: 'POST',
                            route: '/assets',
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
                    })()
                ))
            );
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
                        buffer: await Data.getAssetBuffer(name),
                        name
                    }))()
                ))
            );
            const response = await Api.request({
                method: 'POST',
                route: '/assets',
                files
            });
            expect(response).to.have.status(200);
            expect(response).to.be.json;
            const { assets } = response.body;
            expect(assets).to.be.an('array');
            expect(assets).to.have.lengthOf(files.length);
            await Promise.all(
                assetNames.map((assetName) => (
                    (async () => {
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
                    })()
                ))
            );
        });
    });

    describe('GET /assets/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: '/assets/:id'
            });
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'GET',
                route: `/assets/${forbiddenAsset?.id}`
            }, 403);
        });
        it('Should get an asset', async () => {
            await Promise.all([
                Api.testGetOne({
                    route: '/assets/:id',
                    data: userAssets[0],
                    assert: assertAsset
                }),
                Api.testStaticFile(
                    Path.join('/static', userAssets[0].path)
                )
            ]);
        });
    });

    describe('DELETE /assets/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'DELETE',
                route: '/assets/:id'
            });
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'DELETE',
                route: `/assets/${forbiddenAsset?.id}`
            }, 403);
        });
        it('Should delete an asset', async () => {
            await Api.testDelete({
                route: `/assets/${userAssets[2].id}`,
                testGet: true
            });
            await Api.testStaticFile(
                Path.join('/static', userAssets[2].path),
                false
            );
        });
    });

    describe('GET /directories', () => {
        it('Should list all directories', async () => {
            await Api.testGetList({
                route: '/directories',
                listKey: 'directories',
                data: userDirectories,
                assert: assertDirectory
            });
        });
    });

    describe('POST /directories', () => {
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
            await Promise.all(
                invalidData.map((body) => (
                    Api.testError({
                        method: 'POST',
                        route: '/directories',
                        body
                    }, 400)
                ))
            );
        });
        it('Should create a directory', async () => {
            const createData = [{
                name: 'Test'
            }, {
                name: 'Subtest',
                parentId: directoriesData[0].id
            }];
            await Promise.all(
                createData.map((data) => (
                    Api.testCreate({
                        route: '/directories',
                        data,
                        assert: assertDirectory
                    })
                ))
            );
        });
    });

    describe('GET /directories/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: '/directories/:id'
            });
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'GET',
                route: `/directories/${forbiddenDirectory?.id}`
            }, 403);
        });
        it('Should get an directory', async () => {
            await Api.testGetOne({
                route: '/directories/:id',
                data: userDirectories[0],
                assert: assertDirectory
            });
        });
    });

    describe('POST /directories/:id', () => {
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
            await Promise.all(
                invalidData.map((body) => (
                    Api.testError({
                        method: 'POST',
                        route: `/directories/${userDirectories[0].id}`,
                        body
                    }, 400)
                ))
            );
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'POST',
                route: `/directories/${forbiddenDirectory?.id}`,
                body: {
                    name: 'Test'
                }
            }, 403);
        });
        it('Should edit a directory', async () => {
            const response = await Api.request({
                method: 'POST',
                route: '/directories',
                body: {
                    name: 'Test'
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.testEdit({
                route: `/directories/${id}`,
                data: {
                    name: 'Test1'
                },
                assert: assertDirectory
            });
        });
    });

    describe('DELETE /directories/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'DELETE',
                route: '/directories/:id'
            });
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'DELETE',
                route: `/directories/${forbiddenDirectory?.id}`
            }, 403);
        });
        it('Should delete an directory', async () => {
            // create a directory
            const dirResponse = await Api.request({
                method: 'POST',
                route: '/directories',
                body: {
                    name: 'Test'
                }
            });
            expect(dirResponse).to.have.status(200);
            const directory = dirResponse.body;
            // create a subdirectory
            const subdirResponse = await Api.request({
                method: 'POST',
                route: '/directories',
                body: {
                    name: 'Test',
                    parentId: directory.id
                }
            });
            expect(subdirResponse).to.have.status(200);
            const subDirectory = subdirResponse.body;
            // upload asset in subdirectory
            const buffer = await Data.getAssetBuffer('asset.png');
            const response = await Api.request({
                method: 'POST',
                route: '/assets',
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
                route: `/directories/${directory.id}`,
                testGet: true
            });
            // check subdirectory and asset have also been deleted
            await Api.testError({
                method: 'GET',
                route: `/directories/${subDirectory.id}`
            }, 404);
            await Api.testError({
                method: 'GET',
                route: `/assets/${asset.id}`
            }, 404);
            await Api.testStaticFile(
                Path.join('/static', asset.id.toString()),
                false
            );
        });
    });
});

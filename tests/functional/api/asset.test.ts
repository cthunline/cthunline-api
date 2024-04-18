import path from 'path';
import {
    describe,
    expect,
    test,
    beforeAll,
    beforeEach,
    afterEach
} from 'vitest';

import { assertAsset, assertDirectory } from '../helpers/assert.helper.js';
import { mockEnvVar } from '../../../src/services/env.js';
import { api } from '../helpers/api.helper.js';
import {
    assetsData,
    directoriesData,
    resetData,
    getAssetBuffer,
    resetCache
} from '../helpers/data.helper.js';

const { userId } = assetsData[0];
const userAssets = assetsData.filter(
    ({ userId: assetUserId }) => assetUserId === userId
);
const forbiddenAsset = assetsData.find(
    ({ userId: assetUserId }) => assetUserId !== userId
);
const userDirectories = directoriesData.filter(
    ({ userId: assetUserId }) => assetUserId === userId
);
const forbiddenDirectory = directoriesData.find(
    ({ userId: dirUserId }) => dirUserId !== userId
);

describe('[API] Assets', () => {
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

    describe('GET /assets', () => {
        test('Should list all assets', async () => {
            await api.testGetList({
                route: '/assets',
                listKey: 'assets',
                data: userAssets,
                assert: assertAsset
            });
            for (const { path: assetPath } of assetsData) {
                await api.testStaticFile(path.join('/static', assetPath));
            }
        });
        test('Should list all assets including directory data', async () => {
            await api.testGetList({
                route: '/assets?include=true',
                listKey: 'assets',
                data: userAssets,
                assert: (data: any) => {
                    assertAsset(data);
                    if (data.directoryId) {
                        assertDirectory(data.directory);
                    } else {
                        expect(data.directory).toBeNull();
                    }
                }
            });
        });
    });

    describe('POST /assets', () => {
        test('Should throw a validation error because of wrong file type', async () => {
            for (const name of ['asset.pdf', 'asset.ico']) {
                const buffer = await getAssetBuffer(name);
                await api.testError(
                    {
                        method: 'POST',
                        route: '/assets',
                        files: [
                            {
                                field: 'assets',
                                buffer,
                                name
                            }
                        ]
                    },
                    400
                );
            }
        });
        test('Should throw a validation error because uploaded file is too big', async () => {
            mockEnvVar('ASSET_MAX_SIZE_MB_PER_FILE', 1);
            const name = 'too-big.png';
            const buffer = await getAssetBuffer(name);
            await api.testError(
                {
                    method: 'POST',
                    route: '/assets',
                    files: [
                        {
                            field: 'assets',
                            buffer,
                            name
                        }
                    ]
                },
                400
            );
        });
        test('Should throw a validation error because payload is too big', async () => {
            mockEnvVar('ASSET_MAX_SIZE_MB', 3);
            const name = 'big.jpg';
            const buffer = await getAssetBuffer(name);
            const files = [];
            for (let i = 0; i < 10; i += 1) {
                files.push({
                    field: 'assets',
                    buffer,
                    name: `${name}-${i}`
                });
            }
            await api.testError(
                {
                    method: 'POST',
                    route: '/assets',
                    files
                },
                400
            );
        });
        test('Should upload an asset', async () => {
            const uploadData = [
                {
                    name: 'asset.mp3'
                },
                {
                    name: 'asset.jpg'
                },
                {
                    name: 'asset.png',
                    directoryId: directoriesData[0].id
                },
                {
                    name: 'asset.svg',
                    directoryId: directoriesData[1].id
                }
            ];
            for (const { name, directoryId } of uploadData) {
                const buffer = await getAssetBuffer(name);
                const response = await api.request({
                    method: 'POST',
                    route: '/assets',
                    files: [
                        {
                            field: 'assets',
                            buffer,
                            name
                        }
                    ],
                    fields: directoryId
                        ? {
                              directoryId
                          }
                        : undefined
                });
                expect(response).toHaveStatus(200);
                expect(response.body).to.be.an('object');
                const { assets } = response.body;
                expect(assets).to.be.an('array');
                expect(assets).to.have.lengthOf(1);
                assertAsset(assets[0], {
                    type: name.endsWith('mp3') ? 'audio' : 'image',
                    name,
                    userId
                });
                const { path: assetPath } = assets[0];
                await api.testStaticFile(path.join('/static', assetPath));
            }
        });
        test('Should upload multiple assets', async () => {
            const assetNames = [
                'asset.mp3',
                'asset.jpg',
                'asset.png',
                'asset.svg'
            ];
            const files: { field: string; buffer: Buffer; name: string }[] = [];
            for (const name of assetNames) {
                files.push({
                    field: 'assets',
                    buffer: await getAssetBuffer(name),
                    name
                });
            }
            const response = await api.request({
                method: 'POST',
                route: '/assets',
                files
            });
            expect(response).toHaveStatus(200);
            expect(response.body).to.be.an('object');
            const { assets } = response.body;
            expect(assets).to.be.an('array');
            expect(assets).to.have.lengthOf(files.length);
            for (const assetName of assetNames) {
                const asset = assets.find(
                    ({ name }: any) => name === assetName
                );
                assertAsset(asset, {
                    type: assetName.endsWith('mp3') ? 'audio' : 'image',
                    name: assetName,
                    userId
                });
                await api.testStaticFile(path.join('/static', asset.path));
            }
        });
    });

    describe('GET /assets/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'GET',
                route: '/assets/:id'
            });
        });
        test('Should throw a forbidden error', async () => {
            await api.testError(
                {
                    method: 'GET',
                    route: `/assets/${forbiddenAsset?.id}`
                },
                403
            );
        });
        test('Should get an asset', async () => {
            await api.testGetOne({
                route: '/assets/:id',
                data: userAssets[0],
                assert: assertAsset
            });
            await api.testStaticFile(path.join('/static', userAssets[0].path));
        });
    });

    describe('DELETE /assets/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'DELETE',
                route: '/assets/:id'
            });
        });
        test('Should throw a forbidden error', async () => {
            await api.testError(
                {
                    method: 'DELETE',
                    route: `/assets/${forbiddenAsset?.id}`
                },
                403
            );
        });
        test('Should delete an asset', async () => {
            await api.testDelete({
                route: `/assets/${userAssets[2].id}`,
                testGet: true
            });
            await api.testStaticFile(
                path.join('/static', userAssets[2].path),
                false
            );
        });
    });

    describe('GET /directories', () => {
        test('Should list all directories', async () => {
            await api.testGetList({
                route: '/directories',
                listKey: 'directories',
                data: userDirectories,
                assert: assertDirectory
            });
        });
    });

    describe('POST /directories', () => {
        test('Should throw a validation error', async () => {
            const invalidData = [
                {
                    invalidProperty: 'Test'
                },
                {
                    parentId: 'abc123'
                },
                {
                    name: 'Test',
                    invalidProperty: 'Test'
                },
                {
                    name: 'Test',
                    parentId: 'abc123',
                    invalidProperty: 'Test'
                },
                {}
            ];
            for (const body of invalidData) {
                await api.testError(
                    {
                        method: 'POST',
                        route: '/directories',
                        body
                    },
                    400
                );
            }
        });
        test('Should create a directory', async () => {
            const createData = [
                {
                    name: 'Test'
                },
                {
                    name: 'Subtest',
                    parentId: directoriesData[0].id
                }
            ];
            for (const data of createData) {
                await api.testCreate({
                    route: '/directories',
                    data,
                    assert: assertDirectory
                });
            }
        });
    });

    describe('GET /directories/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'GET',
                route: '/directories/:id'
            });
        });
        test('Should throw a forbidden error', async () => {
            await api.testError(
                {
                    method: 'GET',
                    route: `/directories/${forbiddenDirectory?.id}`
                },
                403
            );
        });
        test('Should get an directory', async () => {
            await api.testGetOne({
                route: '/directories/:id',
                data: userDirectories[0],
                assert: assertDirectory
            });
        });
    });

    describe('PATCH /directories/:id', () => {
        test('Should throw a validation error', async () => {
            const invalidData = [
                {
                    invalidProperty: 'Test'
                },
                {
                    name: 'Test',
                    invalidProperty: 'Test'
                },
                {
                    name: 'Test',
                    parentId: 'abc123'
                },
                {}
            ];
            for (const body of invalidData) {
                await api.testError(
                    {
                        method: 'PATCH',
                        route: `/directories/${userDirectories[0].id}`,
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
                    route: `/directories/${forbiddenDirectory?.id}`,
                    body: {
                        name: 'Test'
                    }
                },
                403
            );
        });
        test('Should edit a directory', async () => {
            const response = await api.request({
                method: 'POST',
                route: '/directories',
                body: {
                    name: 'Test'
                }
            });
            expect(response).toHaveStatus(200);
            const {
                body: { id }
            } = response;
            await api.testEdit({
                route: `/directories/${id}`,
                data: {
                    name: 'Test1'
                },
                assert: assertDirectory
            });
        });
    });

    describe('DELETE /directories/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'DELETE',
                route: '/directories/:id'
            });
        });
        test('Should throw a forbidden error', async () => {
            await api.testError(
                {
                    method: 'DELETE',
                    route: `/directories/${forbiddenDirectory?.id}`
                },
                403
            );
        });
        test('Should delete an directory', async () => {
            // create a directory
            const dirResponse = await api.request({
                method: 'POST',
                route: '/directories',
                body: {
                    name: 'Test'
                }
            });
            expect(dirResponse).toHaveStatus(200);
            const directory = dirResponse.body;
            // upload asset in directory
            const dirAssetBuffer = await getAssetBuffer('asset.png');
            const dirAssetResponse = await api.request({
                method: 'POST',
                route: '/assets',
                files: [
                    {
                        field: 'assets',
                        buffer: dirAssetBuffer,
                        name: 'asset.png'
                    }
                ],
                fields: {
                    directoryId: directory.id
                }
            });
            expect(dirAssetResponse).toHaveStatus(200);
            const { assets: dirAssets } = dirAssetResponse.body;
            const dirAsset = dirAssets[0];
            // create a subdirectory
            const subdirResponse = await api.request({
                method: 'POST',
                route: '/directories',
                body: {
                    name: 'Test',
                    parentId: directory.id
                }
            });
            expect(subdirResponse).toHaveStatus(200);
            const subDirectory = subdirResponse.body;
            // upload asset in subdirectory
            const subDirAssetBuffer = await getAssetBuffer('asset.png');
            const subDirAssetResponse = await api.request({
                method: 'POST',
                route: '/assets',
                files: [
                    {
                        field: 'assets',
                        buffer: subDirAssetBuffer,
                        name: 'asset.png'
                    }
                ],
                fields: {
                    directoryId: subDirectory.id
                }
            });
            expect(subDirAssetResponse).toHaveStatus(200);
            const { assets: subDirAssets } = subDirAssetResponse.body;
            const subDirAsset = subDirAssets[0];
            // delete main directory
            await api.testDelete({
                route: `/directories/${directory.id}`,
                testGet: true
            });
            // check subdirectory and asset have also been deleted
            await api.testError(
                {
                    method: 'GET',
                    route: `/directories/${subDirectory.id}`
                },
                404
            );
            await api.testError(
                {
                    method: 'GET',
                    route: `/assets/${dirAsset.id}`
                },
                404
            );
            await api.testStaticFile(
                path.join('/static', dirAsset.id.toString()),
                false
            );
            await api.testError(
                {
                    method: 'GET',
                    route: `/assets/${subDirAsset.id}`
                },
                404
            );
            await api.testStaticFile(
                path.join('/static', subDirAsset.id.toString()),
                false
            );
        });
    });
});

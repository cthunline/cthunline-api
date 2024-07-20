import path from 'node:path';
import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test
} from 'vitest';

import { mockEnvVar } from '../../../src/services/env.js';
import { getUserCharacters } from '../../../src/services/queries/character.js';
import { api } from '../helpers/api.helper.js';
import { assertCharacter } from '../helpers/assert.helper.js';
import { findCharacter, getAnotherUser } from '../helpers/character.helper.js';
import {
    charactersData,
    getAssetBuffer,
    resetCache,
    resetData
} from '../helpers/data.helper.js';

const findCharacterFromDb = async (userId: number, gameId?: string) => {
    const characters = await getUserCharacters(userId, gameId);
    if (characters[0]) {
        return characters[0];
    }
    throw new Error(`Could not find character for user ${userId}`);
};

describe('[API] Characters', () => {
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

    describe('GET /characters', () => {
        test('Should list all characters', async () => {
            await api.testGetList({
                route: '/characters',
                listKey: 'characters',
                data: charactersData,
                assert: assertCharacter
            });
        });
        test('Should list all characters belonging to a user', async () => {
            const { userId } = charactersData[0];
            await api.testGetList({
                route: `/characters?user=${userId}`,
                listKey: 'characters',
                data: charactersData.filter(
                    ({ userId: charUserId }) => userId === charUserId
                ),
                assert: assertCharacter
            });
        });
    });

    describe('POST /characters', () => {
        test('Should throw a validation error', async () => {
            const { gameId, name, data } = findCharacter(
                api.userId,
                'callOfCthulhu'
            );
            const invalidData = [
                {
                    invalidProperty: 'Test'
                },
                {
                    gameId,
                    name,
                    data,
                    invalidProperty: 'Test'
                },
                {
                    gameId: 'invalidGame',
                    name,
                    data
                },
                {
                    name,
                    data
                },
                {
                    gameId,
                    name,
                    data: {
                        ...data,
                        invalidProperty: 'Test'
                    }
                },
                {
                    gameId,
                    name,
                    data: {
                        ...data,
                        characteristics: {
                            ...data.characteristics,
                            strength: {
                                regular: 50,
                                half: 25,
                                fifth: 10,
                                invalidProperty: 'Test'
                            }
                        }
                    }
                },
                {}
            ];
            for (const body of invalidData) {
                await api.testError(
                    {
                        method: 'POST',
                        route: '/characters',
                        body
                    },
                    400
                );
            }
        });
        test('Should create a character', async () => {
            const gameIds = [
                'apocalypseWorld',
                'callOfCthulhu',
                'starWarsD6',
                'dnd5',
                'seventhSea',
                'warhammerFantasy'
            ];
            for (const gameId of gameIds) {
                const { data } = findCharacter(api.userId, gameId);
                await api.testCreate({
                    route: '/characters',
                    data: {
                        gameId,
                        name: `Test ${gameId}`,
                        data
                    },
                    assert: assertCharacter
                });
            }
        });
    });

    describe('GET /characters/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'GET',
                route: '/characters/:id'
            });
        });
        test('Should get a character', async () => {
            await api.testGetOne({
                route: '/characters/:id',
                data: charactersData[0],
                assert: assertCharacter
            });
        });
    });

    describe('PATCH /characters/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'PATCH',
                route: '/characters/:id',
                body: {
                    name: 'Test'
                }
            });
        });
        test('Should throw a validation error', async () => {
            const { gameId, name, data } = findCharacter(
                api.userId,
                'callOfCthulhu'
            );
            const response = await api.request({
                method: 'POST',
                route: '/characters',
                body: {
                    gameId,
                    name: 'Test',
                    data
                }
            });
            expect(response).toHaveStatus(200);
            const {
                body: { id }
            } = response;
            const invalidData = [
                {
                    invalidProperty: 'Test'
                },
                {
                    name,
                    data,
                    invalidProperty: 'Test'
                },
                {
                    gameId,
                    name,
                    data
                },
                {
                    name,
                    data: {
                        ...data,
                        invalidProperty: 'Test'
                    }
                },
                {
                    name,
                    data: {
                        ...data,
                        characteristics: {
                            ...data.characteristics,
                            strength: {
                                regular: 50,
                                half: 25,
                                fifth: 10,
                                invalidProperty: 'Test'
                            }
                        }
                    }
                },
                {}
            ];
            for (const body of invalidData) {
                await api.testError(
                    {
                        method: 'PATCH',
                        route: `/characters/${id}`,
                        body
                    },
                    400
                );
            }
        });
        test('Should throw a forbidden error', async () => {
            const anotherUser = getAnotherUser(api.userId);
            const anotherUserCharacter = findCharacter(anotherUser.id);
            await api.testError(
                {
                    method: 'PATCH',
                    route: `/characters/${anotherUserCharacter.id}`,
                    body: {
                        name: 'Test'
                    }
                },
                403
            );
        });
        test('Should edit a character', async () => {
            const { id, gameId, data } = findCharacter(
                api.userId,
                'callOfCthulhu'
            );
            const response = await api.request({
                method: 'POST',
                route: '/characters',
                body: {
                    gameId,
                    name: 'Test',
                    data
                }
            });
            expect(response).toHaveStatus(200);
            const {
                body: { id: createdId }
            } = response;
            const editChar = charactersData.find(
                ({ id: charId, gameId: charGameId }) =>
                    charGameId === gameId && charId !== id
            );
            if (editChar) {
                await api.testEdit({
                    route: `/characters/${createdId}`,
                    data: {
                        name: 'Test edit',
                        data: editChar.data
                    },
                    assert: assertCharacter
                });
            } else {
                throw new Error('Could not find edit data for character');
            }
        });
    });

    describe('DELETE /characters/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'DELETE',
                route: '/characters/:id'
            });
        });
        test('Should throw a forbidden error', async () => {
            const anotherUser = getAnotherUser(api.userId);
            const anotherUserCharacter = findCharacter(anotherUser.id);
            await api.testError(
                {
                    method: 'DELETE',
                    route: `/characters/${anotherUserCharacter.id}`
                },
                403
            );
        });
        test('Should delete a character', async () => {
            const { gameId, data } = findCharacter(api.userId, 'callOfCthulhu');
            const response = await api.request({
                method: 'POST',
                route: '/characters',
                body: {
                    gameId,
                    name: 'Test',
                    data
                }
            });
            expect(response).toHaveStatus(200);
            const {
                body: { id }
            } = response;
            await api.testDelete({
                route: `/characters/${id}`,
                testGet: true
            });
        });
    });

    describe('POST /characters/:id/portrait', () => {
        test('Should throw error because of invalid ID', async () => {
            const invalidData = [
                {
                    id: 'invalid',
                    status: 400
                },
                {
                    id: '1234',
                    status: 404
                }
            ];
            const name = 'asset.png';
            const buffer = await getAssetBuffer(name);
            for (const { id, status } of invalidData) {
                await api.testError(
                    {
                        method: 'POST',
                        route: `/characters/${id}/portrait`,
                        files: [
                            {
                                field: 'portrait',
                                buffer,
                                name
                            }
                        ]
                    },
                    status
                );
            }
        });
        test('Should throw a forbidden error', async () => {
            const anotherUser = getAnotherUser(api.userId);
            const anotherUserCharacter = findCharacter(anotherUser.id);
            const name = 'asset.png';
            const buffer = await getAssetBuffer(name);
            await api.testError(
                {
                    method: 'POST',
                    route: `/characters/${anotherUserCharacter.id}/portrait`,
                    files: [
                        {
                            field: 'portrait',
                            buffer,
                            name
                        }
                    ]
                },
                403
            );
        });
        test('Should throw a validation error', async () => {
            const { id: characterId } = findCharacter(
                api.userId,
                'callOfCthulhu'
            );
            const name = 'asset.png';
            const buffer = await getAssetBuffer(name);
            await api.testError(
                {
                    method: 'POST',
                    route: `/characters/${characterId}/portrait`,
                    files: [
                        {
                            field: 'invalid',
                            buffer,
                            name
                        }
                    ]
                },
                400
            );
        });
        test('Should throw a validation error because of wrong file type', async () => {
            const { id: characterId } = findCharacter(
                api.userId,
                'callOfCthulhu'
            );
            const name = 'asset.mp3';
            const buffer = await getAssetBuffer(name);
            await api.testError(
                {
                    method: 'POST',
                    route: `/characters/${characterId}/portrait`,
                    files: [
                        {
                            field: 'portrait',
                            buffer,
                            name
                        }
                    ]
                },
                400
            );
        });
        test('Should throw a validation error because uploaded file is too big', async () => {
            mockEnvVar('PORTRAIT_MAX_SIZE_MB', 1);
            const { id: characterId } = findCharacter(
                api.userId,
                'callOfCthulhu'
            );
            const name = 'too-big.png';
            const buffer = await getAssetBuffer(name);
            await api.testError(
                {
                    method: 'POST',
                    route: `/characters/${characterId}/portrait`,
                    files: [
                        {
                            field: 'portrait',
                            buffer,
                            name
                        }
                    ]
                },
                400
            );
        });
        test('Should upload a portrait', async () => {
            const character = findCharacter(api.userId, 'callOfCthulhu');
            const { id: characterId } = character;
            const uploadData = ['asset.jpg', 'asset.png'];
            for (const name of uploadData) {
                const buffer = await getAssetBuffer(name);
                const response = await api.request({
                    method: 'POST',
                    route: `/characters/${characterId}/portrait`,
                    files: [
                        {
                            field: 'portrait',
                            buffer,
                            name
                        }
                    ]
                });
                expect(response).toHaveStatus(200);
                expect(response.body).to.be.an('object');
                const updatedCharacter = response.body;
                assertCharacter(updatedCharacter, {
                    ...character,
                    portrait: updatedCharacter.portrait
                });
                await api.testStaticFile(
                    path.join('/static', updatedCharacter.portrait)
                );
            }
        });
    });

    describe('DELETE /characters/:id/portrait', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'DELETE',
                route: '/characters/:id/portrait'
            });
        });
        test('Should throw a forbidden error', async () => {
            const anotherUser = getAnotherUser(api.userId);
            const anotherUserCharacter = findCharacter(anotherUser.id);
            await api.testError(
                {
                    method: 'DELETE',
                    route: `/characters/${anotherUserCharacter.id}/portrait`
                },
                403
            );
        });
        test('Should delete an asset', async () => {
            const character = findCharacter(api.userId, 'callOfCthulhu');
            const { id: characterId } = character;
            const name = 'asset.png';
            const buffer = await getAssetBuffer(name);
            const response = await api.request({
                method: 'POST',
                route: `/characters/${characterId}/portrait`,
                files: [
                    {
                        field: 'portrait',
                        buffer,
                        name
                    }
                ]
            });
            expect(response).toHaveStatus(200);
            const updatedCharacter = response.body;
            await api.testStaticFile(
                path.join('/static', updatedCharacter.portrait)
            );
            const deleteResponse = await api.request({
                method: 'DELETE',
                route: `/characters/${characterId}/portrait`
            });
            expect(deleteResponse).toHaveStatus(200);
            expect(deleteResponse.body).to.be.an('object');
            assertCharacter(deleteResponse.body);
            await api.testStaticFile(
                path.join('/static', updatedCharacter.portrait),
                false
            );
        });
    });

    describe('PUT /characters/:id/transfer/:userId', () => {
        test('Should throw error because of invalid ID', async () => {
            const { id: characterId } = await findCharacterFromDb(api.userId);
            const anotherUserId = getAnotherUser(api.userId).id;
            const invalidData = [
                {
                    characterId: 'invalid',
                    userId: anotherUserId,
                    status: 400
                },
                {
                    characterId: '1234',
                    userId: anotherUserId,
                    status: 404
                },
                {
                    characterId,
                    userId: 'invalid',
                    status: 400
                },
                {
                    characterId,
                    userId: '1234',
                    status: 404
                }
            ];
            for (const { characterId: charId, userId, status } of invalidData) {
                await api.testError(
                    {
                        method: 'PUT',
                        route: `/characters/${charId}/transfer/${userId}`
                    },
                    status
                );
            }
        });
        test('Should throw a forbidden error', async () => {
            const anotherUserId = getAnotherUser(api.userId).id;
            const { id: characterId } =
                await findCharacterFromDb(anotherUserId);
            await api.testError(
                {
                    method: 'PUT',
                    route: `/characters/${characterId}/transfer/${anotherUserId}`
                },
                403
            );
        });
        test('Should throw a conflict error because transfering to self', async () => {
            const { id: characterId } = await findCharacterFromDb(api.userId);
            await api.testError(
                {
                    method: 'PUT',
                    route: `/characters/${characterId}/transfer/${api.userId}`
                },
                409
            );
        });
        test('Should transfer a character to another user', async () => {
            const { id: characterId } = await findCharacterFromDb(api.userId);
            const anotherUserId = getAnotherUser(api.userId).id;
            const transferResponse = await api.request({
                method: 'PUT',
                route: `/characters/${characterId}/transfer/${anotherUserId}`
            });
            expect(transferResponse).toHaveStatus(200);
            expect(transferResponse.body).to.be.an('object');
            expect(Object.keys(transferResponse.body)).toHaveLength(0);
            const charResponse = await api.request({
                method: 'GET',
                route: `/characters/${characterId}`
            });
            expect(charResponse).toHaveStatus(200);
            expect(charResponse.body).to.be.an('object');
            expect(charResponse.body.userId).to.equal(anotherUserId);
            const charsResponse = await api.request({
                method: 'GET',
                route: `/characters?user=${api.userId}`
            });
            expect(charsResponse).toHaveStatus(200);
            expect(charResponse.body).to.be.an('object');
            expect(charsResponse.body).to.have.property('characters');
            expect(charsResponse.body.characters).to.be.an('array');
            let containsChar = false;
            for (const { id } of charsResponse.body.characters) {
                if (id === characterId) {
                    containsChar = true;
                }
            }
            expect(containsChar).toEqual(false);
        });
    });
});

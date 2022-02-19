import { expect } from 'chai';

import Api from '../../helpers/api.helper';
import Data from '../../helpers/data.helper';
import { assertCharacter } from '../../helpers/assert.helper';

import usersData from '../../data/users.json';
import charactersData from '../../data/characters.json';

describe('[API] Characters', () => {
    beforeEach(async () => {
        await Data.reset();
        await Api.login();
    });

    describe('GET /characters', () => {
        it('Should list all characters', async () => {
            await Api.testGetList({
                route: '/characters',
                listKey: 'characters',
                data: charactersData,
                assert: assertCharacter
            });
        });
    });

    describe('GET /users/:id/characters', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: '/users/:id/characters'
            });
        });
        it("Should list user's characters", async () => {
            await Promise.all(
                usersData.map(({ id }) => (
                    Api.testGetList({
                        route: `/users/${id}/characters`,
                        listKey: 'characters',
                        data: charactersData.filter(({ userId }) => (
                            userId === id
                        )),
                        assert: assertCharacter
                    })
                ))
            );
        });
    });

    describe('POST /users/:id/characters', () => {
        const { gameId, name, data } = charactersData.find(({ userId }) => (
            userId === Api.userId
        )) ?? charactersData[0];
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'POST',
                route: '/users/:id/characters'
            });
        });
        it('Should throw a validation error', async () => {
            const invalidData = [{
                invalidProperty: 'Test'
            }, {
                gameId,
                name,
                data,
                invalidProperty: 'Test'
            }, {
                gameId: 'invalidGame',
                name,
                data
            }, {
                name,
                data
            }, {
                gameId,
                name,
                data: {
                    ...data,
                    invalidProperty: 'Test'
                }
            }, {
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
            }, {}];
            for (const body of invalidData) {
                await Api.testError({
                    method: 'POST',
                    route: `/users/${Api.userId}/characters`,
                    body
                }, 400);
            }
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'POST',
                route: `/users/${usersData[0].id}/characters`,
                body: {
                    gameId,
                    name: 'Test'
                }
            }, 403);
        });
        it('Should create a character', async () => {
            await Api.testCreate({
                route: `/users/${Api.userId}/characters`,
                data: {
                    gameId,
                    name: 'Test',
                    data
                },
                assert: assertCharacter
            });
        });
    });

    describe('GET /users/:id/characters/:id', () => {
        const { id: userId } = usersData[0];
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: `/users/${userId}/characters/:id`
            });
        });
        it('Should get a character', async () => {
            await Api.testGetOne({
                route: `/users/${userId}/characters/:id`,
                data: charactersData[0],
                assert: assertCharacter
            });
        });
    });

    describe('POST /users/:id/characters/:id', () => {
        const { gameId, name, data } = charactersData.find(({ userId }) => (
            userId === Api.userId
        )) ?? charactersData[0];
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'POST',
                route: `/users/${Api.userId}/characters/:id`,
                body: {
                    name: 'Test'
                }
            });
        });
        it('Should throw a validation error', async () => {
            const response = await Api.request({
                method: 'POST',
                route: `/users/${Api.userId}/characters`,
                body: {
                    gameId,
                    name: 'Test',
                    data
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            const invalidData = [{
                invalidProperty: 'Test'
            }, {
                name,
                data,
                invalidProperty: 'Test'
            }, {
                gameId,
                name,
                data
            }, {
                name,
                data: {
                    ...data,
                    invalidProperty: 'Test'
                }
            }, {
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
            }, {}];
            for (const body of invalidData) {
                await Api.testError({
                    method: 'POST',
                    route: `/users/${Api.userId}/characters/${id}`,
                    body
                }, 400);
            }
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'POST',
                route: `/users/${usersData[0].id}/characters/${charactersData[1].id}`,
                body: {
                    name: 'Test'
                }
            }, 403);
        });
        it('Should edit a character', async () => {
            const response = await Api.request({
                method: 'POST',
                route: `/users/${Api.userId}/characters`,
                body: {
                    gameId,
                    name: 'Test',
                    data
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            const { data: editData } = charactersData[1];
            await Api.testEdit({
                route: `/users/${Api.userId}/characters/${id}`,
                data: {
                    name: 'Test edit',
                    data: editData
                },
                assert: assertCharacter
            });
        });
    });

    describe('DELETE /users/:id/characters/:id', () => {
        const { gameId, data } = charactersData.find(({ userId }) => (
            userId === Api.userId
        )) ?? charactersData[0];
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'DELETE',
                route: `/users/${Api.userId}/characters/:id`
            });
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'DELETE',
                route: `/users/${usersData[0].id}/characters/${charactersData[1].id}`
            }, 403);
        });
        it('Should delete a character', async () => {
            const response = await Api.request({
                method: 'POST',
                route: `/users/${Api.userId}/characters`,
                body: {
                    gameId,
                    name: 'Test',
                    data
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.testDelete({
                route: `/users/${Api.userId}/characters/${id}`,
                testGet: true
            });
        });
    });
});

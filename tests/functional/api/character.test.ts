import { expect } from 'chai';

import Api from '../helpers/api.helper';
import Data, {
    charactersData,
    usersData
} from '../helpers/data.helper';
import { assertCharacter } from '../helpers/assert.helper';

const findUserCharacter = (userId: string) => {
    const character = charactersData.find((char) => (
        char.userId === Api.userId
    ));
    if (character) {
        return character;
    }
    throw new Error(`Could not find character for user ${userId}`);
};

describe('[API] Characters', () => {
    before(async () => {
        await Data.reset();
    });
    beforeEach(async () => {
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
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'POST',
                route: '/users/:id/characters'
            });
        });
        it('Should throw a validation error', async () => {
            const { gameId, name, data } = findUserCharacter(Api.userId);
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
            const { gameId } = findUserCharacter(Api.userId);
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
            const { gameId, data } = findUserCharacter(Api.userId);
            await Api.testCreate({
                route: `/users/${Api.userId}/characters`,
                data: {
                    gameId,
                    name: 'Test',
                    data
                },
                assert: assertCharacter,
                getRoute: '/characters/:id'
            });
        });
    });

    describe('GET /characters/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: '/characters/:id'
            });
        });
        it('Should get a character', async () => {
            await Api.testGetOne({
                route: '/characters/:id',
                data: charactersData[0],
                assert: assertCharacter
            });
        });
    });

    describe('POST /characters/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'POST',
                route: '/characters/:id',
                body: {
                    name: 'Test'
                }
            });
        });
        it('Should throw a validation error', async () => {
            const { gameId, name, data } = findUserCharacter(Api.userId);
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
                    route: `/characters/${id}`,
                    body
                }, 400);
            }
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'POST',
                route: `/characters/${charactersData[1].id}`,
                body: {
                    name: 'Test'
                }
            }, 403);
        });
        it('Should edit a character', async () => {
            const { gameId, data } = findUserCharacter(Api.userId);
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
                route: `/characters/${id}`,
                data: {
                    name: 'Test edit',
                    data: editData
                },
                assert: assertCharacter
            });
        });
    });

    describe('DELETE /users/:id/characters/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'DELETE',
                route: '/characters/:id'
            });
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'DELETE',
                route: `/characters/${charactersData[1].id}`
            }, 403);
        });
        it('Should delete a character', async () => {
            const { gameId, data } = findUserCharacter(Api.userId);
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
                route: `/characters/${id}`,
                testGet: true
            });
        });
    });
});

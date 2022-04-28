import { expect } from 'chai';

import Api from '../helpers/api.helper';
import Data, {
    charactersData,
    usersData
} from '../helpers/data.helper';
import { assertCharacter } from '../helpers/assert.helper';

const findCharacter = (userId: number, gameId: string) => {
    const character = charactersData.find((char) => (
        char.userId === Api.userId && char.gameId === gameId
    ));
    if (character) {
        return character as any;
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
    afterEach(async () => {
        await Api.logout();
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
            const { gameId, name, data } = findCharacter(Api.userId, 'callOfCthulhu');
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
            await Promise.all(
                invalidData.map((body) => (
                    Api.testError({
                        method: 'POST',
                        route: `/users/${Api.userId}/characters`,
                        body
                    }, 400)
                ))
            );
        });
        it('Should throw a forbidden error', async () => {
            const { gameId } = findCharacter(Api.userId, 'callOfCthulhu');
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
            const gameIds = ['callOfCthulhu', 'starWarsD6'];
            await Promise.all(
                gameIds.map((gameId) => (
                    (async () => {
                        const { data } = findCharacter(Api.userId, gameId);
                        await Api.testCreate({
                            route: `/users/${Api.userId}/characters`,
                            data: {
                                gameId,
                                name: `Test ${gameId}`,
                                data
                            },
                            assert: assertCharacter,
                            getRoute: '/characters/:id'
                        });
                    })()
                ))
            );
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
            const { gameId, name, data } = findCharacter(Api.userId, 'callOfCthulhu');
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
            await Promise.all(
                invalidData.map((body) => (
                    Api.testError({
                        method: 'POST',
                        route: `/characters/${id}`,
                        body
                    }, 400)
                ))
            );
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
            const {
                id,
                gameId,
                data
            } = findCharacter(Api.userId, 'callOfCthulhu');
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
            const { body: { id: createdId } } = response;
            const editChar = charactersData.find(({
                id: charId,
                gameId: charGameId
            }) => (
                charGameId === gameId && charId !== id
            ));
            if (editChar) {
                await Api.testEdit({
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
            const { gameId, data } = findCharacter(Api.userId, 'callOfCthulhu');
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

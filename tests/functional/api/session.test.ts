import { expect } from 'chai';

import Api from '../helpers/api.helper';
import Data, { sessionsData, notesData } from '../helpers/data.helper';
import {
    assertSession,
    assertUser,
    assertNotes
} from '../helpers/assert.helper';

const { gameId } = sessionsData[0];

const getUserNotes = (userId: string) => {
    const notes = notesData.find(({ userId: notesUserId }) => (
        notesUserId === userId
    ));
    if (notes) {
        return notes;
    }
    throw new Error('Could not find user notes');
};

describe('[API] Sessions', () => {
    before(async () => {
        await Data.reset();
    });
    beforeEach(async () => {
        await Api.login();
    });
    afterEach(async () => {
        await Api.logout();
    });

    describe('GET /sessions', () => {
        it('Should list all sessions', async () => {
            await Api.testGetList({
                route: '/sessions',
                listKey: 'sessions',
                data: sessionsData,
                assert: assertSession
            });
        });
        it('Should list all sessions including master data', async () => {
            await Api.testGetList({
                route: '/sessions?include=true',
                listKey: 'sessions',
                data: sessionsData,
                assert: (data: any) => {
                    assertSession(data);
                    assertUser(data.master);
                }
            });
        });
    });

    describe('POST /sessions', () => {
        it('Should throw a validation error', async () => {
            const invalidData = [{
                invalidProperty: 'Test'
            }, {
                name: 'Test',
                sketch: {},
                invalidProperty: 'Test'
            }, {}];
            for (const body of invalidData) {
                await Api.testError({
                    method: 'POST',
                    route: '/sessions',
                    body
                }, 400);
            }
        });
        it('Should create a session', async () => {
            await Api.testCreate({
                route: '/sessions',
                data: {
                    gameId,
                    name: 'Test'
                },
                assert: assertSession
            });
            const { sketch } = sessionsData[0];
            await Api.testCreate({
                route: '/sessions',
                data: {
                    gameId,
                    name: 'Test',
                    sketch
                },
                assert: assertSession
            });
        });
    });

    describe('GET /sessions/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: '/sessions/:id'
            });
        });
        it('Should get a session', async () => {
            await Api.testGetOne({
                route: '/sessions/:id',
                data: sessionsData[0],
                assert: assertSession
            });
        });
    });

    describe('POST /sessions/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'POST',
                route: '/sessions/:id',
                body: {
                    name: 'Test'
                }
            });
        });
        it('Should throw a validation error', async () => {
            const response = await Api.request({
                method: 'POST',
                route: '/sessions',
                body: {
                    gameId,
                    name: 'Test'
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            const invalidData = [{
                invalidProperty: 'Test'
            }, {
                name: 'Test',
                sketch: {},
                invalidProperty: 'Test'
            }, {}];
            for (const body of invalidData) {
                await Api.testError({
                    method: 'POST',
                    route: `/sessions/${id}`,
                    body
                }, 400);
            }
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'POST',
                route: `/sessions/${sessionsData[1].id}`,
                body: {
                    name: 'Test11'
                }
            }, 403);
        });
        it('Should edit a session', async () => {
            const response = await Api.request({
                method: 'POST',
                route: '/sessions',
                body: {
                    gameId,
                    name: 'Test'
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.testEdit({
                route: `/sessions/${id}`,
                data: {
                    name: 'Test1'
                },
                assert: assertSession
            });
            const { sketch } = sessionsData[1];
            await Api.testEdit({
                route: `/sessions/${id}`,
                data: {
                    name: 'Test2',
                    sketch
                },
                assert: assertSession
            });
        });
    });

    describe('DELETE /sessions/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'DELETE',
                route: '/sessions/:id'
            });
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError({
                method: 'DELETE',
                route: `/sessions/${sessionsData[1].id}`
            }, 403);
        });
        it('Should delete a session', async () => {
            const response = await Api.request({
                method: 'POST',
                route: '/sessions',
                body: {
                    gameId,
                    name: 'Test'
                }
            });
            expect(response).to.have.status(200);
            const { body: { id } } = response;
            await Api.testDelete({
                route: `/sessions/${id}`,
                testGet: true
            });
        });
    });

    describe('GET /sessions/:id/notes', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: '/sessions/:id/notes'
            });
        });
        it('Should get notes a user', async () => {
            const notes = getUserNotes(Api.userId);
            const response = await Api.request({
                method: 'GET',
                route: `/sessions/${notes?.sessionId}/notes`
            });
            expect(response).to.have.status(200);
            expect(response).to.be.json;
            const { body } = response;
            assertNotes(body, notes);
        });
    });

    describe('POST /sessions/:id/notes', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'POST',
                route: '/sessions/:id/notes',
                body: {
                    text: 'Test'
                }
            });
        });
        it('Should throw a validation error', async () => {
            const invalidData = [{
                invalidProperty: 'Test'
            }, {
                text: 'Test',
                invalidProperty: 'Test'
            }, {}];
            for (const body of invalidData) {
                await Api.testError({
                    method: 'POST',
                    route: `/sessions/${sessionsData[0].id}/notes`,
                    body
                }, 400);
            }
        });
        it('Should edit the notes of a user', async () => {
            const editData = [{
                text: 'Test1'
            }, {
                text: 'Test2'
            }, {
                text: 'Test3'
            }];
            for (const body of editData) {
                await Api.testEdit({
                    route: `/sessions/${sessionsData[1].id}/notes`,
                    data: body,
                    assert: assertNotes
                });
            }
        });
    });
});

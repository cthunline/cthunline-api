import { expect } from 'chai';

import Api from '../helpers/api.helper';
import Data, { sessionsData, notesData } from '../helpers/data.helper';
import { assertNote } from '../helpers/assert.helper';

const notesById: Record<number, Record<string, any>> = Object.fromEntries(
    notesData.map((note: Record<string, any>) => [note.id, note])
);

const getUserNotes = (
    userId: number
): Record<string, Record<string, any>[]> => ({
    notes: notesData.filter(
        ({ userId: notesUserId }) => notesUserId === userId
    ),
    sharedNotes: notesData.filter(
        ({ userId: notesUserId, isShared }) =>
            notesUserId !== userId && isShared
    )
});

const sharedNote = notesData.find(
    ({ userId, isShared }) => userId !== Api.userId && isShared
);
if (!sharedNote) {
    throw new Error('Could not find any shared notes');
}

const unsharedNote = notesData.find(
    ({ userId, isShared }) => userId !== Api.userId && !isShared
);
if (!unsharedNote) {
    throw new Error('Could not find any shared notes');
}

const getApiNotes = async (sessionId: number) => {
    const response = await Api.request({
        method: 'GET',
        route: `/sessions/${sessionId}/notes`
    });
    return response.body as Record<string, Record<string, any>[]>;
};

const testNoteList = async (includeUsers: boolean = false) => {
    const expected = getUserNotes(Api.userId);
    const includeParam = includeUsers ? '?include=true' : '';
    const response = await Api.request({
        method: 'GET',
        route: `/sessions/${sessionsData[0].id}/notes${includeParam}`
    });
    expect(response).to.have.status(200);
    expect(response.body).to.be.an('object');
    const { body } = response;
    expect(body).to.be.an('object');
    ['notes', 'sharedNotes'].forEach((key: string) => {
        expect(body).to.haveOwnProperty(key);
        expect(body[key]).to.be.an('array');
        expect(body[key]).to.have.lengthOf(expected[key].length);
        body[key].forEach((note: Record<string, any>) => {
            assertNote(note, notesById[note.id], includeUsers);
        });
    });
};

describe('[API] Notes', () => {
    before(async () => {
        await Data.reset();
    });
    beforeEach(async () => {
        await Api.login();
    });
    afterEach(async () => {
        await Api.logout();
    });

    describe('GET /sessions/:id/notes', () => {
        it("Should get user's notes in a session", async () => {
            await testNoteList();
        });
        it("Should get user's notes including user data", async () => {
            await testNoteList(true);
        });
    });

    describe('POST /sessions/:id/notes', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'POST',
                route: '/sessions/:id/notes',
                body: {
                    title: 'Test',
                    text: 'Test'
                }
            });
        });
        it('Should throw a validation error', async () => {
            const invalidData = [
                {
                    invalidProperty: 'Test'
                },
                {
                    text: 'Test',
                    invalidProperty: 'Test'
                },
                {
                    text: 'Test'
                },
                {
                    title: 'Test',
                    text: 'Test',
                    isShared: true,
                    position: 1
                },
                {}
            ];
            for (const body of invalidData) {
                await Api.testError(
                    {
                        method: 'POST',
                        route: `/sessions/${sessionsData[0].id}/notes`,
                        body
                    },
                    400
                );
            }
        });
        it('Should create a note in a session', async () => {
            const { notes } = getUserNotes(Api.userId);
            const expectedPosition =
                Math.max(
                    ...(notes.map(({ position }) => position) as number[])
                ) + 1;
            const data = {
                title: 'Some title',
                text: 'Some text'
            };
            await Api.testCreate({
                route: `/sessions/${sessionsData[0].id}/notes`,
                getRoute: '/notes/:id',
                data,
                expected: {
                    ...data,
                    isShared: false,
                    position: expectedPosition
                },
                assert: assertNote
            });
        });
    });

    describe('GET /notes/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'GET',
                route: '/notes/:id'
            });
        });
        it('Should throw a forbidden error', async () => {
            await Api.testError(
                {
                    method: 'GET',
                    route: `/notes/${unsharedNote.id}`
                },
                403
            );
        });
        it('Should get a note', async () => {
            const { notes } = getUserNotes(Api.userId);
            await Api.testGetOne({
                route: '/notes/:id',
                data: notes[0],
                assert: assertNote
            });
        });
        it('Should get a shared note', async () => {
            await Api.testGetOne({
                route: '/notes/:id',
                data: sharedNote,
                assert: assertNote
            });
        });
    });

    describe('POST /notes/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'POST',
                route: '/notes/:id',
                body: {
                    text: 'Test'
                }
            });
        });
        it('Should throw a forbidden error', async () => {
            for (const noteId of [sharedNote.id, unsharedNote.id]) {
                await Api.testError(
                    {
                        method: 'POST',
                        route: `/notes/${noteId}`,
                        body: {
                            title: 'Test'
                        }
                    },
                    403
                );
            }
        });
        it('Should throw a validation error', async () => {
            const response = await Api.request({
                method: 'POST',
                route: `/sessions/${sessionsData[0].id}/notes`,
                body: {
                    title: 'Some test title',
                    text: 'Some test text'
                }
            });
            expect(response).to.have.status(200);
            const { body: note } = response;
            const invalidData = [
                {
                    invalidProperty: 'Some value'
                },
                {
                    title: 'Test edit',
                    invalidProperty: 'Some value'
                },
                {
                    text: 'Random edit text',
                    isShared: true,
                    position: 3
                },
                {}
            ];
            for (const body of invalidData) {
                await Api.testError(
                    {
                        method: 'POST',
                        route: `/notes/${note.id}`,
                        body
                    },
                    400
                );
            }
        });
        it('Should update a note', async () => {
            const response = await Api.request({
                method: 'POST',
                route: `/sessions/${sessionsData[0].id}/notes`,
                body: {
                    title: 'Some test title',
                    text: 'Some test text'
                }
            });
            expect(response).to.have.status(200);
            const { body: note } = response;
            const editData = [
                {
                    title: 'Test edit'
                },
                {
                    title: 'Some edit',
                    text: 'Random edit text'
                },
                {
                    text: 'Some edit text',
                    isShared: true
                }
            ];
            let expected = { ...note };
            delete expected.updatedAt;
            for (const data of editData) {
                expected = {
                    ...expected,
                    ...data
                };
                await Api.testEdit({
                    route: `/notes/${note.id}`,
                    data,
                    assert: assertNote,
                    expected
                });
            }
        });
    });

    describe('PUT /notes/:id/(up|down)', () => {
        it('Should throw a not found error', async () => {
            const { notes } = getUserNotes(Api.userId);
            await Api.testError(
                {
                    method: 'PUT',
                    route: `/notes/${notes[0].id}/invalid`
                },
                404
            );
        });
        it('Should throw error because of invalid ID', async () => {
            for (const action of ['up', 'down']) {
                await Api.testInvalidIdError({
                    method: 'PUT',
                    route: `/notes/:id/${action}`
                });
            }
        });
        it('Should throw a forbidden error', async () => {
            for (const noteId of [sharedNote.id, unsharedNote.id]) {
                for (const action of ['up', 'down']) {
                    await Api.testError(
                        {
                            method: 'PUT',
                            route: `/notes/${noteId}/${action}`
                        },
                        403
                    );
                }
            }
        });
        it('Should throw a conflict error', async () => {
            const { notes } = await getApiNotes(sessionsData[0].id);
            const notesByPosition = Object.fromEntries(
                notes.map((note: any) => [note.position, note])
            );
            const maxPosition = Math.max(
                ...Object.keys(notesByPosition).map((k) => parseInt(k))
            );
            const lowestPositionNote = notesByPosition[1];
            const highestPositionNote = notesByPosition[maxPosition];
            await Api.testError(
                {
                    method: 'PUT',
                    route: `/notes/${highestPositionNote.id}/down`
                },
                409
            );
            await Api.testError(
                {
                    method: 'PUT',
                    route: `/notes/${lowestPositionNote.id}/up`
                },
                409
            );
        });
        it('Should move position of a note', async () => {
            const moveData = [
                {
                    position: 1,
                    action: 'down'
                },
                {
                    position: 2,
                    action: 'down'
                },
                {
                    position: 2,
                    action: 'up'
                },
                {
                    position: 'last',
                    action: 'up'
                }
            ];
            for (const { action, position } of moveData) {
                const { notes } = await getApiNotes(sessionsData[0].id);
                const maxPosition = Math.max(
                    ...notes.map(({ position: pos }) => parseInt(pos))
                );
                const targetPosition =
                    position === 'last' ? maxPosition : Number(position);
                const note = notes.find(({ position: notePosition }) =>
                    position === 'last'
                        ? notePosition === maxPosition
                        : notePosition === position
                );
                const otherNotePosition =
                    action === 'down' ? targetPosition + 1 : targetPosition - 1;
                const otherNote = notes.find(
                    ({ position: notePosition }) =>
                        notePosition === otherNotePosition
                );
                if (!note || !otherNote) {
                    throw new Error(
                        'Could not get notes to test position move'
                    );
                }
                const expectedNotePosition =
                    action === 'down' ? note.position + 1 : note.position - 1;
                const expectedOtherNotePosition =
                    action === 'down'
                        ? otherNote.position - 1
                        : otherNote.position + 1;
                const expectedNotes: Record<string, any>[] = [
                    {
                        ...note,
                        position: expectedNotePosition
                    },
                    {
                        ...otherNote,
                        position: expectedOtherNotePosition
                    }
                ];
                const moveUpResponse = await Api.request({
                    method: 'PUT',
                    route: `/notes/${note.id}/${action}`
                });
                expect(moveUpResponse).to.have.status(200);
                expect(moveUpResponse.body).to.be.an('object');
                assertNote(moveUpResponse.body, expectedNotes[0]);
                for (const expectedNote of expectedNotes) {
                    const { body } = await Api.request({
                        method: 'GET',
                        route: `/notes/${expectedNote.id}`
                    });
                    assertNote(body, expectedNote);
                }
            }
        });
    });

    describe('DELETE /notes/:id', () => {
        it('Should throw error because of invalid ID', async () => {
            await Api.testInvalidIdError({
                method: 'DELETE',
                route: '/notes/:id'
            });
        });
        it('Should throw a forbidden error', async () => {
            for (const noteId of [sharedNote.id, unsharedNote.id]) {
                await Api.testError(
                    {
                        method: 'DELETE',
                        route: `/notes/${noteId}`
                    },
                    403
                );
            }
        });
        it('Should delete a note', async () => {
            const { notes } = getUserNotes(Api.userId);
            await Api.testDelete({
                route: `/notes/${notes[0].id}`,
                testGet: true
            });
            const { notes: updatedNotes } = await getApiNotes(
                notes[0].sessionId
            );
            updatedNotes.forEach(({ position }, index: number) => {
                expect(position).to.equal(index + 1);
            });
        });
    });
});

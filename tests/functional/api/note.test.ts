import {
    afterEach,
    beforeAll,
    beforeEach,
    describe,
    expect,
    test
} from 'vitest';

import { api } from '../helpers/api.helper.js';
import { assertNote } from '../helpers/assert.helper.js';
import {
    notesData,
    resetCache,
    resetData,
    sessionsData
} from '../helpers/data.helper.js';

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
    ({ userId, isShared }) => userId !== api.userId && isShared
);
if (!sharedNote) {
    throw new Error('Could not find any shared notes');
}

const unsharedNote = notesData.find(
    ({ userId, isShared }) => userId !== api.userId && !isShared
);
if (!unsharedNote) {
    throw new Error('Could not find any shared notes');
}

const getApiNotes = async (sessionId: number) => {
    const response = await api.request({
        method: 'GET',
        route: `/sessions/${sessionId}/notes`
    });
    return response.body as Record<string, Record<string, any>[]>;
};

describe('[API] Notes', () => {
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

    describe('GET /sessions/:id/notes', () => {
        test("Should get user's notes in a session", async () => {
            const expected = getUserNotes(api.userId);
            const response = await api.request({
                method: 'GET',
                route: `/sessions/${sessionsData[0].id}/notes`
            });
            expect(response).toHaveStatus(200);
            expect(response.body).to.be.an('object');
            const { body } = response;
            expect(body).to.be.an('object');
            for (const key of ['notes', 'sharedNotes']) {
                expect(body).to.haveOwnProperty(key);
                expect(body[key]).to.be.an('array');
                expect(body[key]).to.have.lengthOf(expected[key].length);
                for (const note of body[key]) {
                    assertNote(note, notesById[note.id], true);
                }
            }
        });
    });

    describe('POST /sessions/:id/notes', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'POST',
                route: '/sessions/:id/notes',
                body: {
                    title: 'Test',
                    text: 'Test'
                }
            });
        });
        test('Should throw a validation error', async () => {
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
                await api.testError(
                    {
                        method: 'POST',
                        route: `/sessions/${sessionsData[0].id}/notes`,
                        body
                    },
                    400
                );
            }
        });
        test('Should create a note in a session', async () => {
            const { notes } = getUserNotes(api.userId);
            const expectedPosition =
                Math.max(
                    ...(notes.map(({ position }) => position) as number[])
                ) + 1;
            const data = {
                title: 'Some title',
                text: 'Some text'
            };
            await api.testCreate({
                route: `/sessions/${sessionsData[0].id}/notes`,
                getRoute: '/notes/:id',
                data,
                expected: {
                    ...data,
                    isShared: false,
                    position: expectedPosition
                },
                assert: (dt, ex) => assertNote(dt, ex, true)
            });
        });
    });

    describe('GET /notes/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'GET',
                route: '/notes/:id'
            });
        });
        test('Should throw a forbidden error', async () => {
            await api.testError(
                {
                    method: 'GET',
                    route: `/notes/${unsharedNote.id}`
                },
                403
            );
        });
        test('Should get a note', async () => {
            const { notes } = getUserNotes(api.userId);
            await api.testGetOne({
                route: '/notes/:id',
                data: notes[0],
                assert: (dt, ex) => assertNote(dt, ex, true)
            });
        });
        test('Should get a shared note', async () => {
            await api.testGetOne({
                route: '/notes/:id',
                data: sharedNote,
                assert: (dt, ex) => assertNote(dt, ex, true)
            });
        });
    });

    describe('PATCH /notes/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'PATCH',
                route: '/notes/:id',
                body: {
                    text: 'Test'
                }
            });
        });
        test('Should throw a forbidden error', async () => {
            for (const noteId of [sharedNote.id, unsharedNote.id]) {
                await api.testError(
                    {
                        method: 'PATCH',
                        route: `/notes/${noteId}`,
                        body: {
                            title: 'Test'
                        }
                    },
                    403
                );
            }
        });
        test('Should throw a validation error', async () => {
            const response = await api.request({
                method: 'POST',
                route: `/sessions/${sessionsData[0].id}/notes`,
                body: {
                    title: 'Some test title',
                    text: 'Some test text'
                }
            });
            expect(response).toHaveStatus(200);
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
                await api.testError(
                    {
                        method: 'PATCH',
                        route: `/notes/${note.id}`,
                        body
                    },
                    400
                );
            }
        });
        test('Should update a note', async () => {
            const response = await api.request({
                method: 'POST',
                route: `/sessions/${sessionsData[0].id}/notes`,
                body: {
                    title: 'Some test title',
                    text: 'Some test text'
                }
            });
            expect(response).toHaveStatus(200);
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
            let { updatedAt = undefined, ...expected } = { ...note };
            for (const data of editData) {
                expected = {
                    ...expected,
                    ...data
                };
                await api.testEdit({
                    route: `/notes/${note.id}`,
                    data,
                    expected,
                    assert: (dt, ex) => assertNote(dt, ex, true)
                });
            }
        });
    });

    describe('PUT /notes/:id/(up|down)', () => {
        test('Should throw a not found error', async () => {
            const { notes } = getUserNotes(api.userId);
            await api.testError(
                {
                    method: 'PUT',
                    route: `/notes/${notes[0].id}/invalid`
                },
                404
            );
        });
        test('Should throw error because of invalid ID', async () => {
            for (const action of ['up', 'down']) {
                await api.testInvalidIdError({
                    method: 'PUT',
                    route: `/notes/:id/${action}`
                });
            }
        });
        test('Should throw a forbidden error', async () => {
            for (const noteId of [sharedNote.id, unsharedNote.id]) {
                for (const action of ['up', 'down']) {
                    await api.testError(
                        {
                            method: 'PUT',
                            route: `/notes/${noteId}/${action}`
                        },
                        403
                    );
                }
            }
        });
        test('Should throw a conflict error', async () => {
            const { notes } = await getApiNotes(sessionsData[0].id);
            const notesByPosition = Object.fromEntries(
                notes.map((note: any) => [note.position, note])
            );
            const maxPosition = Math.max(
                ...Object.keys(notesByPosition).map((k) => Number.parseInt(k))
            );
            const lowestPositionNote = notesByPosition[1];
            const highestPositionNote = notesByPosition[maxPosition];
            await api.testError(
                {
                    method: 'PUT',
                    route: `/notes/${highestPositionNote.id}/down`
                },
                409
            );
            await api.testError(
                {
                    method: 'PUT',
                    route: `/notes/${lowestPositionNote.id}/up`
                },
                409
            );
        });
        test('Should move position of a note', async () => {
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
                    ...notes.map(({ position: pos }) => Number.parseInt(pos))
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
                const moveUpResponse = await api.request({
                    method: 'PUT',
                    route: `/notes/${note.id}/${action}`
                });
                expect(moveUpResponse).toHaveStatus(200);
                expect(moveUpResponse.body).to.be.an('object');
                const { user, ...expected } = expectedNotes[0];
                assertNote(moveUpResponse.body, expected, true);
                for (const expectedNote of expectedNotes) {
                    const { user: noteUser, ...rest } = expectedNote;
                    const { body } = await api.request({
                        method: 'GET',
                        route: `/notes/${expectedNote.id}`
                    });
                    assertNote(body, rest, true);
                }
            }
        });
    });

    describe('DELETE /notes/:id', () => {
        test('Should throw error because of invalid ID', async () => {
            await api.testInvalidIdError({
                method: 'DELETE',
                route: '/notes/:id'
            });
        });
        test('Should throw a forbidden error', async () => {
            for (const noteId of [sharedNote.id, unsharedNote.id]) {
                await api.testError(
                    {
                        method: 'DELETE',
                        route: `/notes/${noteId}`
                    },
                    403
                );
            }
        });
        test('Should delete a note', async () => {
            const { notes } = getUserNotes(api.userId);
            await api.testDelete({
                route: `/notes/${notes[0].id}`,
                testGet: true
            });
            const { notes: updatedNotes } = await getApiNotes(
                notes[0].sessionId
            );
            for (let index = 0; index < updatedNotes.length; index++) {
                const { position } = updatedNotes[index];
                expect(position).to.equal(index + 1);
            }
        });
    });
});

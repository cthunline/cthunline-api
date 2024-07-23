import { beforeAll, beforeEach, describe, expect, test } from 'vitest';

import {
    assertNote,
    assertSocketMeta,
    assertUser
} from '../helpers/assert.helper.js';
import {
    notesData,
    resetCache,
    resetData,
    usersData
} from '../helpers/data.helper.js';
import { socketHelper } from '../helpers/sockets.helper.js';

const getUserByEmail = (email: string) => {
    const user = usersData.find(({ email: userEmail }) => userEmail === email);
    if (!user) {
        throw new Error('Could not find user for test');
    }
    return user;
};

const getNote = (
    userId: number,
    options?: {
        anotherUser?: boolean;
        isShared?: boolean;
    }
) => {
    const note = notesData.find(({ userId: noteUserId, isShared }) => {
        if (
            (options?.isShared === true && !isShared) ||
            (options?.isShared === false && isShared)
        ) {
            return false;
        }
        if (options?.anotherUser) {
            return noteUserId !== userId;
        }
        return noteUserId === userId;
    });
    if (!note) {
        throw new Error('Could not find note for test');
    }
    return note;
};

describe('[Sockets] Note', () => {
    beforeAll(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await resetCache();
    });

    describe('Update note', () => {
        test('Should fail to update note because of invalid data', async () => {
            await socketHelper.testError({
                emitEvent: 'noteUpdate',
                onEvent: 'noteUpdate',
                data: (userId: number) => {
                    const { id: noteId } = getNote(userId, {
                        isShared: true
                    });
                    return [
                        {},
                        undefined,
                        { noteId: 'value' },
                        { noteId, text: 1234 }
                    ];
                },
                expectedStatus: 400,
                isMaster: true
            });
        });

        test('Should fail to update note because it does not belong to user', async () => {
            await socketHelper.testError({
                emitEvent: 'noteUpdate',
                onEvent: 'noteUpdate',
                data: (userId: number) => {
                    const { id: noteId } = getNote(userId, {
                        isShared: true,
                        anotherUser: true
                    });
                    return { noteId };
                },
                expectedStatus: 403,
                isMaster: false
            });
        });

        test("Should fail to update note because it's not shared", async () => {
            await socketHelper.testError({
                emitEvent: 'noteUpdate',
                onEvent: 'noteUpdate',
                data: (userId: number) => {
                    const { id: noteId } = getNote(userId, {
                        isShared: false
                    });
                    return { noteId };
                },
                expectedStatus: 403,
                isMaster: false
            });
        });

        test('Should update note', async () => {
            const {
                sockets: [masterSocket, player1Socket, player2Socket],
                emails: [, player1Email]
            } = await socketHelper.setupSession();
            const player1User = getUserByEmail(player1Email);
            const { id: noteId } = getNote(player1User.id, {
                isShared: true
            });
            await Promise.all([
                ...[masterSocket, player2Socket].map(
                    (socket) =>
                        new Promise<void>((resolve, reject) => {
                            socket.on('noteUpdate', (data: any) => {
                                const { user, isMaster, note } = data;
                                assertSocketMeta(data);
                                assertUser(user);
                                expect(isMaster).toEqual(false);
                                assertNote(note);
                                socket.disconnect();
                                resolve();
                            });
                            socket.on('error', (err: any) => {
                                socket.disconnect();
                                reject(err);
                            });
                        })
                ),
                player1Socket.emit('noteUpdate', { noteId })
            ]);
        });
    });

    describe('Delete note', () => {
        test('Should fail to delete note because of invalid data', async () => {
            await socketHelper.testError({
                emitEvent: 'noteDelete',
                onEvent: 'noteDelete',
                data: (userId: number) => {
                    const { id: noteId } = getNote(userId, {
                        isShared: true
                    });
                    return [
                        {},
                        undefined,
                        { noteId: 'value' },
                        { noteId, text: 1234 }
                    ];
                },
                expectedStatus: 400,
                isMaster: true
            });
        });

        test('Should delete note', async () => {
            const {
                sockets: [masterSocket, player1Socket, player2Socket],
                emails: [, player1Email]
            } = await socketHelper.setupSession();
            const player1User = getUserByEmail(player1Email);
            const { id: noteId } = getNote(player1User.id, {
                isShared: true
            });
            await Promise.all([
                ...[masterSocket, player2Socket].map(
                    (socket) =>
                        new Promise<void>((resolve, reject) => {
                            socket.on('noteDelete', (data: any) => {
                                const { noteId: deletedNoteId } = data;
                                expect(deletedNoteId).to.be.a('number');
                                expect(deletedNoteId).to.equal(noteId);
                                socket.disconnect();
                                resolve();
                            });
                            socket.on('error', (err: any) => {
                                socket.disconnect();
                                reject(err);
                            });
                        })
                ),
                player1Socket.emit('noteDelete', { noteId })
            ]);
        });
    });
});

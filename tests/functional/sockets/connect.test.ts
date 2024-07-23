import type { Socket } from 'socket.io-client';
import { beforeAll, beforeEach, describe, expect, test } from 'vitest';

import { api } from '../helpers/api.helper.js';
import {
    assertCharacter,
    assertSocketMeta,
    assertUser
} from '../helpers/assert.helper.js';
import { findCharacter, getAnotherUser } from '../helpers/character.helper.js';
import {
    charactersData,
    resetCache,
    resetData,
    sessionsData,
    usersData
} from '../helpers/data.helper.js';
import { socketHelper } from '../helpers/sockets.helper.js';

describe('[Sockets] Connection', () => {
    beforeAll(async () => {
        await resetData();
    });
    beforeEach(async () => {
        await resetCache();
    });

    test('Should fail to connect socket because of invalid handshake data', async () => {
        const { jwt } = await api.login();
        const invalidData = [
            {
                jwt,
                query: {}
            },
            {
                jwt,
                query: {
                    sessionId: sessionsData[1].id
                }
            },
            {
                jwt,
                query: {
                    characterId: charactersData[0].id
                }
            }
        ];
        for (const data of invalidData) {
            await socketHelper.failConnect({
                jwt: data.jwt,
                query: data.query,
                status: 400
            });
        }
    });

    test('Should fail to connect socket because of invalid authentication JWT', async () => {
        await socketHelper.failConnect({
            jwt: 'invalidJWT',
            query: {
                sessionId: sessionsData[1].id,
                characterId: charactersData[0].id
            },
            status: 401
        });
    });

    test('Should fail to connect socket because of invalid sessionId or characterId', async () => {
        const { jwt } = await api.login();
        const invalidQueries = [
            {
                sessionId: 'invalid',
                characterId: charactersData[0].id
            },
            {
                sessionId: sessionsData[1].id,
                characterId: 'invalid'
            }
        ];
        for (const query of invalidQueries) {
            await socketHelper.failConnect({
                jwt,
                query,
                status: 400
            });
        }
    });

    test('Should fail to connect socket because of not found sessionId or characterId', async () => {
        const { jwt } = await api.login();
        const notFoundQueries = [
            {
                sessionId: 999,
                characterId: charactersData[0].id
            },
            {
                sessionId: sessionsData[1].id,
                characterId: 999
            }
        ];
        for (const query of notFoundQueries) {
            await socketHelper.failConnect({
                jwt,
                query,
                status: 404
            });
        }
    });

    test('Should fail to connect socket because of forbidden characterId', async () => {
        const { jwt } = await api.login();
        const anotherUser = getAnotherUser(api.userId);
        const anotherUserCharacter = findCharacter(anotherUser.id);
        await socketHelper.failConnect({
            jwt,
            query: {
                sessionId: sessionsData[1].id,
                characterId: anotherUserCharacter.id
            },
            status: 403
        });
    });

    test('Should connect to socket', async () => {
        const { jwt } = await api.login();
        const userCharacter = findCharacter(api.userId);
        await socketHelper.connect({
            jwt,
            sessionId: sessionsData[1].id,
            characterId: userCharacter.id
        });
        const masterUser = usersData.find(
            ({ id }) => id === sessionsData[1].masterId
        );
        const { jwt: masterJwt } = await api.login({
            email: masterUser?.email ?? '',
            password: 'test'
        });
        await socketHelper.connect({
            jwt: masterJwt,
            sessionId: sessionsData[1].id,
            isMaster: true
        });
    });

    test('Should disconnect copycat socket on connection', async () => {
        const { jwt } = await api.login();
        const userCharacter = findCharacter(api.userId);
        const copycatSocket = await socketHelper.connect({
            jwt,
            sessionId: sessionsData[1].id,
            characterId: userCharacter.id
        });
        await Promise.all([
            new Promise<void>((resolve, reject) => {
                copycatSocket.on('disconnect', () => {
                    resolve();
                });
                copycatSocket.on('error', (err: any) => {
                    copycatSocket.disconnect();
                    reject(err);
                });
            }),
            socketHelper.connect({
                jwt,
                sessionId: sessionsData[2].id,
                characterId: userCharacter.id
            })
        ]);
    });

    test('Should emit join and leave events', async () => {
        const [masterEmail, playerEmail] = usersData.map(({ email }) => email);
        const [masterAuthUser, playerAuthUser] = await Promise.all(
            [masterEmail, playerEmail].map((email) =>
                api.login({
                    email,
                    password: 'test'
                })
            )
        );
        const sessionId = sessionsData.find(
            ({ masterId }) => masterAuthUser.id === masterId
        )?.id;
        const assertData = (
            data: Record<string, any>,
            expectedIsMaster: boolean,
            expectedUsersLength: number
        ) => {
            const { user, isMaster, users } = data;
            assertSocketMeta(data);
            assertUser(user);
            expect(isMaster).to.equal(expectedIsMaster);
            expect(users).have.lengthOf(expectedUsersLength);
            for (const sessionUser of users) {
                const isSessionUserMaster =
                    sessionUser.id === masterAuthUser.id;
                assertUser(sessionUser);
                if (isSessionUserMaster) {
                    expect(sessionUser.character).toBeNull();
                } else {
                    assertCharacter(sessionUser.character);
                }
                expect(sessionUser.isMaster).to.be.equal(isSessionUserMaster);
            }
        };
        const removeListeners = (socket: Socket) => {
            socket.off('join');
            socket.off('error');
        };
        const masterSocket = socketHelper.getSocketClient({
            jwt: masterAuthUser.jwt,
            query: { sessionId }
        });
        await Promise.all([
            new Promise<void>((resolve, reject) => {
                masterSocket.on('join', (data: any) => {
                    assertData(data, true, 1);
                    removeListeners(masterSocket);
                    resolve();
                });
                masterSocket.on('error', (err: any) => {
                    masterSocket.disconnect();
                    reject(err);
                });
            }),
            socketHelper.connect({
                socket: masterSocket,
                isMaster: true
            })
        ]);
        const [, playerSocket] = await Promise.all([
            new Promise<void>((resolve, reject) => {
                masterSocket.on('join', (data: any) => {
                    assertData(data, false, 2);
                    removeListeners(masterSocket);
                    resolve();
                });
                masterSocket.on('error', (err: any) => {
                    masterSocket.disconnect();
                    reject(err);
                });
            }),
            socketHelper.connect({
                jwt: playerAuthUser.jwt,
                sessionId,
                characterId: charactersData.find(
                    (character) => character.userId === playerAuthUser.id
                )?.id
            })
        ]);
        await Promise.all([
            new Promise<void>((resolve, reject) => {
                masterSocket.on('leave', (data: any) => {
                    assertData(data, false, 1);
                    removeListeners(masterSocket);
                    resolve();
                });
                masterSocket.on('error', (err: any) => {
                    masterSocket.disconnect();
                    reject(err);
                });
                playerSocket.disconnect();
            })
        ]);
    });
});

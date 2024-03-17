import { expect } from 'chai';

import Api from '../helpers/api.helper.js';
import Data, {
    sessionsData,
    charactersData,
    usersData
} from '../helpers/data.helper.js';
import Sockets from '../helpers/sockets.helper.js';
import {
    assertUser,
    assertCharacter,
    assertSocketMeta
} from '../helpers/assert.helper.js';

describe('[Sockets] Connection', () => {
    before(async () => {
        await Data.reset();
    });

    it('Should fail to connect socket because of invalid handshake data', async () => {
        const { jwt } = await Api.login();
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
            await Sockets.failConnect({
                jwt: data.jwt,
                query: data.query,
                status: 400
            });
        }
    });

    it('Should fail to connect socket because of invalid authentication JWT', async () => {
        await Sockets.failConnect({
            jwt: 'invalidJWT',
            query: {
                sessionId: sessionsData[1].id,
                characterId: charactersData[0].id
            },
            status: 401
        });
    });

    it('Should fail to connect socket because of invalid sessionId or characterId', async () => {
        const { jwt } = await Api.login();
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
            await Sockets.failConnect({
                jwt,
                query,
                status: 400
            });
        }
    });

    it('Should fail to connect socket because of not found sessionId or characterId', async () => {
        const { jwt } = await Api.login();
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
            await Sockets.failConnect({
                jwt,
                query,
                status: 404
            });
        }
    });

    it('Should fail to connect socket because of forbidden characterId', async () => {
        const { jwt } = await Api.login();
        await Sockets.failConnect({
            jwt,
            query: {
                sessionId: sessionsData[1].id,
                characterId: charactersData[1].id
            },
            status: 403
        });
    });

    it('Should connect to socket', async () => {
        const { jwt } = await Api.login();
        await Sockets.connect({
            jwt,
            sessionId: sessionsData[1].id,
            characterId: charactersData[0].id
        });
        const masterUser = usersData.find(
            ({ id }) => id === sessionsData[1].masterId
        );
        const { jwt: masterJWT } = await Api.login({
            email: masterUser?.email ?? '',
            password: 'test'
        });
        await Sockets.connect({
            jwt: masterJWT,
            sessionId: sessionsData[1].id
        });
    });

    it('Should disconnect copycat socket on connection', async () => {
        const { jwt } = await Api.login();
        const copycatSocket = await Sockets.connect({
            jwt,
            sessionId: sessionsData[1].id,
            characterId: charactersData[0].id
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
            Sockets.connect({
                jwt,
                sessionId: sessionsData[2].id,
                characterId: charactersData[0].id
            })
        ]);
    });

    it('Should emit join and leave events', async () => {
        const [masterEmail, playerEmail] = usersData.map(({ email }) => email);
        const [masterAuthUser, playerAuthUser] = await Promise.all(
            [masterEmail, playerEmail].map((email) =>
                Api.login({
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
            users.forEach((sessionUser: Record<string, any>) => {
                const isSessionUserMaster =
                    sessionUser.id === masterAuthUser.id;
                assertUser(sessionUser);
                if (isSessionUserMaster) {
                    expect(sessionUser.character).to.be.null;
                } else {
                    assertCharacter(sessionUser.character);
                }
                expect(sessionUser.isMaster).to.be.equal(isSessionUserMaster);
            });
        };
        const masterSocket = await Sockets.connect({
            jwt: masterAuthUser.jwt,
            sessionId
        });
        const removeListeners = () => {
            masterSocket.off('join');
            masterSocket.off('error');
        };
        await new Promise<void>((resolve, reject) => {
            masterSocket.on('join', (data: any) => {
                assertData(data, true, 1);
                removeListeners();
                resolve();
            });
            masterSocket.on('error', (err: any) => {
                masterSocket.disconnect();
                reject(err);
            });
        });
        const [, playerSocket] = await Promise.all([
            new Promise<void>((resolve, reject) => {
                masterSocket.on('join', (data: any) => {
                    assertData(data, false, 2);
                    removeListeners();
                    resolve();
                });
                masterSocket.on('error', (err: any) => {
                    masterSocket.disconnect();
                    reject(err);
                });
            }),
            Sockets.connect({
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
                    removeListeners();
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

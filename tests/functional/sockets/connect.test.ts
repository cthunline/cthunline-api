import { expect } from 'chai';

import Api from '../helpers/api.helper';
import Data, {
    sessionsData,
    charactersData,
    usersData
} from '../helpers/data.helper';
import Sockets from '../helpers/sockets.helper';
import {
    assertUser,
    assertCharacter,
    assertSocketMeta
} from '../helpers/assert.helper';

describe('[Sockets] Connection', () => {
    before(async () => {
        await Data.reset();
    });

    it('Should fail to connect socket because of invalid handshake data', async () => {
        const { token } = await Api.login();
        const invalidData = [{
            token,
            query: {}
        }, {
            token,
            query: {
                sessionId: sessionsData[1].id
            }
        }, {
            token,
            query: {
                characterId: charactersData[0].id
            }
        }];
        for (const data of invalidData) {
            await Sockets.failConnect({
                token: data.token,
                query: data.query,
                status: 400
            });
        }
    });

    it('Should fail to connect socket because of invalid authentication token', async () => {
        await Sockets.failConnect({
            token: 'invalidToken',
            query: {
                sessionId: sessionsData[1].id,
                characterId: charactersData[0].id
            },
            status: 401
        });
    });

    it('Should fail to connect socket because of invalid sessionId or characterId', async () => {
        const { token } = await Api.login();
        const invalidQueries = [{
            sessionId: 'invalid',
            characterId: charactersData[0].id
        }, {
            sessionId: sessionsData[1].id,
            characterId: 'invalid'
        }];
        for (const query of invalidQueries) {
            await Sockets.failConnect({
                token,
                query,
                status: 400
            });
        }
    });

    it('Should fail to connect socket because of not found sessionId or characterId', async () => {
        const { token } = await Api.login();
        const notFoundQueries = [{
            sessionId: 999,
            characterId: charactersData[0].id
        }, {
            sessionId: sessionsData[1].id,
            characterId: 999
        }];
        for (const query of notFoundQueries) {
            await Sockets.failConnect({
                token,
                query,
                status: 404
            });
        }
    });

    it('Should fail to connect socket because of forbidden characterId', async () => {
        const { token } = await Api.login();
        await Sockets.failConnect({
            token,
            query: {
                sessionId: sessionsData[1].id,
                characterId: charactersData[1].id
            },
            status: 403
        });
    });

    it('Should connect to socket', async () => {
        const { token } = await Api.login();
        await Sockets.connect({
            token,
            sessionId: sessionsData[1].id,
            characterId: charactersData[0].id
        });
        const masterUser = usersData.find(({ id }) => (
            id === sessionsData[1].masterId
        ));
        const {
            token: masterToken
        } = await Api.login({
            email: masterUser?.email ?? '',
            password: 'test'
        });
        await Sockets.connect({
            token: masterToken,
            sessionId: sessionsData[1].id
        });
    });

    it('Should disconnect copycat socket on connection', async () => {
        const { token } = await Api.login();
        const copycatSocket = await Sockets.connect({
            token,
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
                token,
                sessionId: sessionsData[2].id,
                characterId: charactersData[0].id
            })
        ]);
    });

    it('Should emit join and leave events', async () => {
        const [masterEmail, playerEmail] = usersData.map(({ email }) => email);
        const [masterAuthUser, playerAuthUser] = (
            await Promise.all(
                [masterEmail, playerEmail].map((email) => (
                    Api.login({
                        email,
                        password: 'test'
                    })
                ))
            )
        );
        const sessionId = sessionsData.find(({ masterId }) => (
            masterAuthUser.id === masterId
        ))?.id;
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
                const isSessionUserMaster = (
                    sessionUser.id === masterAuthUser.id
                );
                assertUser(sessionUser);
                if (isSessionUserMaster) {
                    expect(sessionUser.character).to.be.null;
                } else {
                    assertCharacter(sessionUser.character);
                }
                expect(sessionUser.isMaster).to.be.equal(
                    isSessionUserMaster
                );
            });
        };
        const masterSocket = await Sockets.connect({
            token: masterAuthUser.token,
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
                token: playerAuthUser.token,
                sessionId,
                characterId: charactersData.find((character) => (
                    character.userId === playerAuthUser.id
                ))?.id
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

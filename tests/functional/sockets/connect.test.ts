import { expect } from 'chai';

import Api from '../helpers/api.helper';
import Data, {
    sessionsData,
    charactersData,
    usersData
} from '../helpers/data.helper';
import Sockets from '../helpers/sockets.helper';
import { assertUser, assertCharacter } from '../helpers/assert.helper';

describe('[Sockets] Connection', () => {
    before(async () => {
        await Data.reset();
    });

    it('Should fail to connect socket because of invalid handshake data', async () => {
        const { bearer } = await Api.login();
        const invalidData = [{
            bearer,
            query: {}
        }, {
            bearer,
            query: {
                sessionId: sessionsData[1].id
            }
        }, {
            bearer,
            query: {
                characterId: charactersData[0].id
            }
        }];
        for (const data of invalidData) {
            await Sockets.failConnect({
                bearer: data.bearer,
                query: data.query,
                status: 400
            });
        }
    });

    it('Should fail to connect socket because of invalid authentication token', async () => {
        await Sockets.failConnect({
            bearer: 'invalidToken',
            query: {
                sessionId: sessionsData[1].id,
                characterId: charactersData[0].id
            },
            status: 401
        });
    });

    it('Should fail to connect socket because of invalid sessionId or characterId', async () => {
        const { bearer } = await Api.login();
        const invalidQueries = [{
            sessionId: 'invalid',
            characterId: charactersData[0].id
        }, {
            sessionId: sessionsData[1].id,
            characterId: 'invalid'
        }];
        for (const query of invalidQueries) {
            await Sockets.failConnect({
                bearer,
                query,
                status: 400
            });
        }
    });

    it('Should fail to connect socket because of not found sessionId or characterId', async () => {
        const { bearer } = await Api.login();
        const notFoundQueries = [{
            sessionId: '1122334455667788aabbccdd',
            characterId: charactersData[0].id
        }, {
            sessionId: sessionsData[1].id,
            characterId: '1122334455667788aabbccdd'
        }];
        for (const query of notFoundQueries) {
            await Sockets.failConnect({
                bearer,
                query,
                status: 404
            });
        }
    });

    it('Should fail to connect socket because of forbidden characterId', async () => {
        const { bearer } = await Api.login();
        await Sockets.failConnect({
            bearer,
            query: {
                sessionId: sessionsData[1].id,
                characterId: charactersData[1].id
            },
            status: 403
        });
    });

    it('Should connect to socket', async () => {
        const { bearer } = await Api.login();
        await Sockets.connect({
            bearer,
            sessionId: sessionsData[1].id,
            characterId: charactersData[0].id
        });
        const masterUser = usersData.find(({ id }) => (
            id === sessionsData[1].masterId
        ));
        const {
            bearer: masterBearer
        } = await Api.login({
            email: masterUser?.email ?? '',
            password: 'test'
        });
        await Sockets.connect({
            bearer: masterBearer,
            sessionId: sessionsData[1].id
        });
    });

    it('Should disconnect copycat socket on connection', async () => {
        const { bearer } = await Api.login();
        const copycatSocket = await Sockets.connect({
            bearer,
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
                bearer,
                sessionId: sessionsData[2].id,
                characterId: charactersData[0].id
            })
        ]);
    });

    it('Should emit join and leave events', async () => {
        const [masterEmail, playerEmail] = usersData.map(({ email }) => email);
        const [masterToken, playerToken] = (
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
            masterToken.userId === masterId
        ))?.id;
        const assertData = (
            { user, isMaster, users }: Record<string, any>,
            expectedIsMaster: boolean,
            expectedUsersLength: number
        ) => {
            assertUser(user);
            expect(isMaster).to.equal(expectedIsMaster);
            expect(users).have.lengthOf(expectedUsersLength);
            users.forEach((sessionUser: Record<string, any>) => {
                const isSessionUserMaster = (
                    sessionUser.id === masterToken.userId
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
            bearer: masterToken.bearer,
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
                bearer: playerToken.bearer,
                sessionId,
                characterId: charactersData.find((character) => (
                    character.userId === playerToken.userId
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

import Api from '../helpers/api.helper';
import Data from '../helpers/data.helper';
import Sockets from '../helpers/sockets.helper';

import sessionsData from '../data/sessions.json';
import charactersData from '../data/characters.json';
import usersData from '../data/users.json';

describe('[Sockets] Connection', () => {
    before(async () => {
        await Data.reset();
    });

    it('Should fail to connect socket because of invalid handshake data', async () => {
        await Api.login();
        const invalidHandshakes = [{
            auth: {},
            query: {
                sessionId: sessionsData[1].id,
                characterId: charactersData[0].id
            }
        }, {
            auth: {
                token: Api.bearer
            },
            query: {}
        }, {
            auth: {
                token: Api.bearer
            },
            query: {
                sessionId: sessionsData[1].id
            }
        }, {
            auth: {
                token: Api.bearer
            },
            query: {
                characterId: charactersData[0].id
            }
        }, {}];
        for (const handshake of invalidHandshakes) {
            await Sockets.failConnect({
                handshake,
                status: 400
            });
        }
    });

    it('Should fail to connect socket because of invalid authentication token', async () => {
        await Sockets.failConnect({
            handshake: {
                auth: {
                    token: 'invalidToken'
                },
                query: {
                    sessionId: sessionsData[1].id,
                    characterId: charactersData[0].id
                }
            },
            status: 401
        });
    });

    it('Should fail to connect socket because of invalid sessionId or characterId', async () => {
        await Api.login();
        const { bearer } = Api;
        const invalidQueries = [{
            sessionId: 'invalid',
            characterId: charactersData[0].id
        }, {
            sessionId: sessionsData[1].id,
            characterId: 'invalid'
        }];
        for (const query of invalidQueries) {
            await Sockets.failConnect({
                handshake: {
                    auth: {
                        token: bearer
                    },
                    query
                },
                status: 400
            });
        }
    });

    it('Should fail to connect socket because of not found sessionId or characterId', async () => {
        await Api.login();
        const { bearer } = Api;
        const notFoundQueries = [{
            sessionId: '1122334455667788aabbccdd',
            characterId: charactersData[0].id
        }, {
            sessionId: sessionsData[1].id,
            characterId: '1122334455667788aabbccdd'
        }];
        for (const query of notFoundQueries) {
            await Sockets.failConnect({
                handshake: {
                    auth: {
                        token: bearer
                    },
                    query
                },
                status: 404
            });
        }
    });

    it('Should fail to connect socket because of forbidden characterId', async () => {
        await Api.login();
        const { bearer } = Api;
        await Sockets.failConnect({
            handshake: {
                auth: {
                    token: bearer
                },
                query: {
                    sessionId: sessionsData[1].id,
                    characterId: charactersData[1].id
                }
            },
            status: 403
        });
    });

    it('Should connect to socket', async () => {
        await Api.login();
        const { bearer } = Api;
        await Sockets.connect({
            bearer,
            sessionId: sessionsData[1].id,
            characterId: charactersData[0].id
        });
        const masterUser = usersData.find(({ id }) => (
            id === sessionsData[1].masterId
        ));
        await Api.login({
            email: masterUser?.email ?? '',
            password: 'test'
        });
        const { bearer: masterBearer } = Api;
        await Sockets.connect({
            bearer: masterBearer,
            sessionId: sessionsData[1].id
        });
    });

    it('Should disconnect copycat socket on connection', async () => {
        await Api.login();
        const { bearer } = Api;
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
            (async () => {
                await Sockets.connect({
                    bearer,
                    sessionId: sessionsData[2].id,
                    characterId: charactersData[0].id
                });
            })()
        ]);
    });
});

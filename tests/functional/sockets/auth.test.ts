import Api from '../../helpers/api.helper';
import Data from '../../helpers/data.helper';
import Sockets from '../../helpers/sockets.helper';

import sessionsData from '../../data/sessions.json';

describe('[Sockets] Authentication', () => {
    beforeEach(async () => {
        await Data.reset();
    });

    it('Should fail to connect socket because of invalid handshake data', async () => {
        const invalidHandshakes = [{
            auth: {
                token: 'someToken'
            },
            query: {}
        }, {
            auth: {},
            query: {
                sessionId: sessionsData[0].id
            }
        }, {
            auth: {},
            query: {}
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
                    sessionId: sessionsData[0].id
                }
            },
            status: 401
        });
    });

    it('Should fail to connect socket because of invalid sessionId', async () => {
        await Api.login();
        const { bearer } = Api;
        await Sockets.failConnect({
            handshake: {
                auth: {
                    token: bearer
                },
                query: {
                    sessionId: 'invalidSessionId'
                }
            },
            status: 400
        });
    });

    it('Should fail to connect socket because of not found sessionId', async () => {
        await Api.login();
        const { bearer } = Api;
        await Sockets.failConnect({
            handshake: {
                auth: {
                    token: bearer
                },
                query: {
                    sessionId: '1122334455667788aabbccdd'
                }
            },
            status: 404
        });
    });

    it('Should connect to socket', async () => {
        await Api.login();
        const { bearer } = Api;
        await Sockets.connect({
            bearer,
            sessionId: sessionsData[1].id
        });
    });
});

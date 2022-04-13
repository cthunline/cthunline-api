import { expect } from 'chai';

import { parseConfiguration } from '../../src/services/configuration';
import { configurationSchema } from '../../src/types/configuration';

const validConf: Record<string, string> = {
    DEFAULT_ADMIN_NAME: 'test',
    DEFAULT_ADMIN_EMAIL: 'test@ŧest.com',
    DEFAULT_ADMIN_PASSWORD: 'test',
    PORT: '8080',
    JWT_SECRET: 'test',
    COOKIE_SECRET: 'test',
    COOKIE_SECURE: '0',
    LOG_ENABLED: '1',
    LOG_DIR: '/path/to/test',
    CHECKPOINT_DISABLE: '1',
    MONGO_URL: 'mongo://test',
    ASSET_DIR: '/path/to/test'
};

describe('[Unit] Configuration', () => {
    describe('parseConfiguration', () => {
        it('Should control and parse configuration', async () => {
            const { PORT, ...incompleteConf } = validConf;
            const data = [{
                conf: validConf,
                shouldSucceed: true
            }, {
                conf: incompleteConf,
                shouldSucceed: false
            }, {
                conf: {
                    ...validConf,
                    DEFAULT_ADMIN_NAME: ''
                },
                shouldSucceed: false
            }, {
                conf: {
                    ...validConf,
                    PORT: 'invalid'
                },
                shouldSucceed: false
            }, {
                conf: {
                    ...validConf,
                    COOKIE_SECURE: 'invalid'
                },
                shouldSucceed: false
            }];
            data.forEach(({ conf, shouldSucceed }) => {
                if (shouldSucceed) {
                    expect(() => (
                        parseConfiguration(conf, configurationSchema)
                    )).to.not.throw();
                } else {
                    expect(() => (
                        parseConfiguration(conf, configurationSchema)
                    )).to.throw(Error);
                }
            });
        });
    });
});

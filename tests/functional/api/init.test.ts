import Api from '../helpers/api.helper.js';
import Data from '../helpers/data.helper.js';
import { assertUser } from '../helpers/assert.helper.js';
import { initDb } from '../../../src/services/prisma.js';
import { getEnv } from '../../../src/services/env.js';

describe('[API] Initialization', () => {
    it('Should create a default user', async () => {
        await Data.reset(false);
        await initDb();
        await Api.login({
            email: getEnv('DEFAULT_ADMIN_EMAIL'),
            password: getEnv('DEFAULT_ADMIN_PASSWORD')
        });
        const defaultUser = {
            name: getEnv('DEFAULT_ADMIN_NAME'),
            email: getEnv('DEFAULT_ADMIN_EMAIL'),
            theme: getEnv('DEFAULT_THEME'),
            locale: getEnv('DEFAULT_LOCALE'),
            isAdmin: true,
            isEnabled: true
        };
        await Api.testGetList({
            route: '/users',
            listKey: 'users',
            data: [defaultUser],
            assert: assertUser
        });
    });
});

import { describe, test } from 'vitest';

import { initDb } from '../../../src/services/db.js';
import { getEnv } from '../../../src/services/env.js';
import { api } from '../helpers/api.helper.js';
import { assertUser } from '../helpers/assert.helper.js';
import { resetCache, resetData } from '../helpers/data.helper.js';

describe('[API] Initialization', () => {
    test('Should create a default user', async () => {
        await resetData(false);
        await resetCache();
        await initDb();
        await api.login({
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
        await api.testGetList({
            route: '/users',
            listKey: 'users',
            data: [defaultUser],
            assert: assertUser
        });
    });
});

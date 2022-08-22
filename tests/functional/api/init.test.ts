import Api from '../helpers/api.helper';
import Data from '../helpers/data.helper';
import { assertUser } from '../helpers/assert.helper';
import { initDb } from '../../../src/services/prisma';
import { env } from '../../../src/services/env';

const {
    DEFAULT_ADMIN_NAME,
    DEFAULT_ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD,
    DEFAULT_THEME,
    DEFAULT_LOCALE
} = env;

describe('[API] Initialization', () => {
    it('Should create a default user', async () => {
        await Data.reset(false);
        await initDb();
        await Api.login({
            email: DEFAULT_ADMIN_EMAIL,
            password: DEFAULT_ADMIN_PASSWORD
        });
        const defaultUser = {
            name: DEFAULT_ADMIN_NAME,
            email: DEFAULT_ADMIN_EMAIL,
            theme: DEFAULT_THEME,
            locale: DEFAULT_LOCALE,
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

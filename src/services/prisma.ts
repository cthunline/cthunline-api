import { PrismaClient } from '@prisma/client';

import { configuration } from './configuration';
import Log from './log';
import { hashPassword } from './controllerServices/auth';
import { NotFoundError } from './errors';

const {
    DEFAULT_ADMIN_NAME,
    DEFAULT_ADMIN_EMAIL,
    DEFAULT_ADMIN_PASSWORD,
    DEFAULT_THEME,
    DEFAULT_LOCALE
} = configuration;

export const Prisma = new PrismaClient();

// database initialization tasks
// create a default user if users collection is empty
export const initDb = async () => {
    const users = await Prisma.user.findMany();
    if (!users.length) {
        const name = DEFAULT_ADMIN_NAME;
        const email = DEFAULT_ADMIN_EMAIL;
        const password = DEFAULT_ADMIN_PASSWORD;
        const theme = DEFAULT_THEME;
        const locale = DEFAULT_LOCALE;
        if (name && email && password) {
            const defaultAdminUser = {
                name,
                email,
                password,
                theme,
                locale,
                isAdmin: true
            };
            await Prisma.user.create({
                data: {
                    ...defaultAdminUser,
                    password: await hashPassword(defaultAdminUser.password)
                }
            });
            Log.warn(`Default user created (email: ${email} / password: ${password})`);
        } else {
            Log.error('Environment file is missing default admin information');
        }
    }
};

// execute query and throw a not found error if there's no result
export const handleNotFound = async <T>(
    name: string,
    queryPromise: Promise<T | null>
): Promise<T> => {
    const result = await queryPromise;
    if (!result) {
        throw new NotFoundError(`${name} not found`);
    }
    return result;
};

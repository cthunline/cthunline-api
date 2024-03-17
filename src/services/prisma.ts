import { PrismaClient } from '@prisma/client';

import { hashPassword } from './crypto.js';
import { getEnv } from './env.js';
import { log } from './log.js';

export const prisma = new PrismaClient();

// database initialization tasks
// create a default user if users collection is empty
export const initDb = async () => {
    const users = await prisma.user.findMany();
    if (!users.length) {
        const name = getEnv('DEFAULT_ADMIN_NAME');
        const email = getEnv('DEFAULT_ADMIN_EMAIL');
        const password = getEnv('DEFAULT_ADMIN_PASSWORD');
        const theme = getEnv('DEFAULT_THEME');
        const locale = getEnv('DEFAULT_LOCALE');
        if (name && email && password) {
            const defaultAdminUser = {
                name,
                email,
                password,
                theme,
                locale,
                isAdmin: true
            };
            await prisma.user.create({
                data: {
                    ...defaultAdminUser,
                    password: await hashPassword(defaultAdminUser.password)
                }
            });
            log.warn(
                `Default user created (email: ${email} / password: ${password})`
            );
        } else {
            log.error('Environment file is missing default admin information');
        }
    }
};

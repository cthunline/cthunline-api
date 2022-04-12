import { PrismaClient } from '@prisma/client';

import Log from './log';
import { hashPassword } from './auth';
import { NotFoundError } from './errors';

export const Prisma = new PrismaClient();

// database initialization tasks
// create a default user if users collection is empty
export const initDb = async () => {
    const users = await Prisma.user.findMany();
    if (!users.length) {
        const name = process.env.DEFAULT_ADMIN_NAME;
        const email = process.env.DEFAULT_ADMIN_EMAIL;
        const password = process.env.DEFAULT_ADMIN_PASSWORD;
        if (name && email && password) {
            const defaultUser = {
                name,
                email,
                password,
                isAdmin: true
            };
            await Prisma.user.create({
                data: {
                    ...defaultUser,
                    password: await hashPassword(defaultUser.password)
                }
            });
            Log.warn(
                `Default user created (email: ${defaultUser.email} / password: ${defaultUser.password})`
            );
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

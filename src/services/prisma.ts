import { PrismaClient } from '@prisma/client';
import Log from './log';
import { hashPassword } from './tools';
import { NotFoundError } from './errors';

export const Prisma = new PrismaClient();

// database initialization tasks
// create a default user if users collection is empty
export const initDb = async () => {
    const users = await Prisma.user.findMany();
    if (!users.length) {
        const defaultUser = {
            name: 'admin',
            email: 'admin@admin.com',
            password: 'cthunline',
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

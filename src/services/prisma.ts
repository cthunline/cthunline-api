import { PrismaClient } from '@prisma/client';
import Log from './log';
import { hashPassword } from './tools';
import { NotFoundError } from './errors';

export const Prisma = new PrismaClient();

export const initDb = async () => {
    const users = await Prisma.user.findMany();
    if (!users.length) {
        await Prisma.user.create({
            data: {
                name: 'admin',
                email: 'admin@admin.com',
                password: await hashPassword('admin')
            }
        });
        Log.warn('Default user created (email: admin@admin.com / password: admin)');
    }
};

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

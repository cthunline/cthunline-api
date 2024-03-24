import { eq, getTableColumns } from 'drizzle-orm';

import { type User, type SafeUser } from '../../drizzle/schema.js';
import { locales } from '../../services/locale.js';
import { db, tables } from '../../services/db.js';
import { getEnv } from '../../services/env.js';
import {
    ForbiddenError,
    ConflictError,
    ValidationError,
    NotFoundError
} from '../../services/errors.js';

/**
Default optional fields for a new user
*/
export const defaultUserData: Pick<
    SafeUser,
    'theme' | 'locale' | 'isAdmin' | 'isEnabled'
> = {
    theme: getEnv('DEFAULT_THEME'),
    locale: getEnv('DEFAULT_LOCALE'),
    isAdmin: false,
    isEnabled: true
};

const { password, ...safeUserColumns } = getTableColumns(tables.users);
/**
Drizzle select object to exclude password in returned data
*/
export const safeUserSelect = { ...safeUserColumns };

export const getUserById = async (userId: number): Promise<SafeUser | null> => {
    const users = await db
        .select(safeUserSelect)
        .from(tables.users)
        .where(eq(tables.users.id, userId))
        .limit(1);
    return users[0] ?? null;
};

export const getUserByIdOrThrow = async (userId: number): Promise<SafeUser> => {
    const user = await getUserById(userId);
    if (!user) {
        throw new NotFoundError('User not found');
    }
    return user;
};

export const getUnsafeUserByIdOrThrow = async (
    userId: number
): Promise<User> => {
    const users = await db
        .select()
        .from(tables.users)
        .where(eq(tables.users.id, userId))
        .limit(1);
    if (!users[0]) {
        throw new NotFoundError('User not found');
    }
    return users[0];
};

export const getUserByEmail = async (
    email: string
): Promise<SafeUser | null> => {
    const users = await db
        .select(safeUserSelect)
        .from(tables.users)
        .where(eq(tables.users.email, email))
        .limit(1);
    return users[0] ?? null;
};

export const getUserByEmailOrThrow = async (
    email: string
): Promise<SafeUser> => {
    const user = await getUserByEmail(email);
    if (!user) {
        throw new NotFoundError('User not found');
    }
    return user;
};

/**
Throws forbidden error if any of the admin fields exists in the user edit body.
*/
export const controlAdminFields = <T extends object>(body: T) => {
    const adminFields = ['isAdmin', 'isEnabled'];
    adminFields.forEach((field) => {
        if (Object.hasOwn(body, field)) {
            throw new ForbiddenError();
        }
    });
};

/**
Checks user email is unique.
*/
export const controlUniqueEmail = async (email: string) => {
    const checkEmail = await getUserByEmail(email);
    if (checkEmail) {
        throw new ConflictError(`Email ${email} already taken`);
    }
};

/**
Checks locale is valid.
*/
export const controlLocale = (locale: string) => {
    if (!locales.includes(locale)) {
        throw new ValidationError(`Invalid locale ${locale}`);
    }
};

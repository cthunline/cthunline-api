import { eq, getTableColumns } from 'drizzle-orm';

import { InternError, NotFoundError } from '../../services/errors.js';
import { db, tables } from '../../services/db.js';
import {
    type SafeUser,
    type UserInsert,
    type UserUpdate
} from '../../drizzle/schema.js';

const { password, ...safeUserColumns } = getTableColumns(tables.users);
/**
Drizzle select object to exclude password in returned data
*/
export const safeUserSelect = { ...safeUserColumns };

/**
Get users.
By default disabled users are excluded except if the includeDisabled parameter is true.
*/
export const getUsers = async (includeDisabled?: boolean) =>
    db
        .select(safeUserSelect)
        .from(tables.users)
        .where(includeDisabled ? undefined : eq(tables.users.isEnabled, true));

/**
Gets a user with the given ID.
*/
export const getUserById = async (userId: number) => {
    const users = await db
        .select(safeUserSelect)
        .from(tables.users)
        .where(eq(tables.users.id, userId));
    if (users[0]) {
        return users[0];
    }
    return null;
};

/**
Gets a user with the given ID.
Throws a NotFoundError if it does not exist.
*/
export const getUserByIdOrThrow = async (userId: number) => {
    const user = await getUserById(userId);
    if (!user) {
        throw new NotFoundError('User not found');
    }
    return user;
};

/**
Gets a user with the given ID including the password field.
*/
export const getUnsafeUserById = async (userId: number) => {
    const users = await db
        .select()
        .from(tables.users)
        .where(eq(tables.users.id, userId));
    if (users[0]) {
        return users[0];
    }
    return null;
};

/**
Gets a user with the given ID including the password field.
Throws a NotFoundError if it does not exist.
*/
export const getUnsafeUserByIdOrThrow = async (userId: number) => {
    const user = await getUnsafeUserById(userId);
    if (!user) {
        throw new NotFoundError('User not found');
    }
    return user;
};

/**
Gets a user with the given email address including the password field.
*/
export const getUnsafeUserByEmail = async (email: string) => {
    const users = await db
        .select()
        .from(tables.users)
        .where(eq(tables.users.email, email));
    if (users[0]) {
        return users[0];
    }
    return null;
};

/**
Gets a user with the given email address including the password field.
Throws a NotFoundError if it does not exist.
*/
export const getUnsafeUserByEmailOrThrow = async (email: string) => {
    const user = await getUnsafeUserByEmail(email);
    if (!user) {
        throw new NotFoundError('User not found');
    }
    return user;
};

/**
Gets a user with the given email address.
*/
export const getUserByEmail = async (
    email: string
): Promise<SafeUser | null> => {
    const users = await db
        .select(safeUserSelect)
        .from(tables.users)
        .where(eq(tables.users.email, email));
    if (users[0]) {
        return users[0];
    }
    return null;
};

/**
Gets a user with the given email address.
Throws a NotFoundError if it does not exist.
*/
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
Creates a user.
*/
export const createUser = async (data: UserInsert) => {
    const createdUsers = await db
        .insert(tables.users)
        .values(data)
        .returning(safeUserSelect);
    const createdUser = createdUsers[0];
    if (!createdUser) {
        throw new InternError('Could not retreive inserted user');
    }
    return createdUser;
};

/**
Updates a user with the given ID.
*/
export const updateUserById = async (userId: number, data: UserUpdate) => {
    const updatedUsers = await db
        .update(tables.users)
        .set(data)
        .where(eq(tables.users.id, userId))
        .returning(safeUserSelect);
    const updatedUser = updatedUsers[0];
    if (!updatedUser) {
        throw new InternError('Could not retreive updated user');
    }
    return updatedUser;
};

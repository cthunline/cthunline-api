import { eq } from 'drizzle-orm';

import type { DirectoryInsert, DirectoryUpdate } from '../../drizzle/schema.js';
import { db, tables } from '../../services/db.js';
import {
    ForbiddenError,
    InternError,
    NotFoundError
} from '../../services/errors.js';

/**
Gets all directories belonging to a user.
*/
export const getUserDirectories = async (userId: number) =>
    db
        .select()
        .from(tables.directories)
        .where(eq(tables.directories.userId, userId));

/**
Gets an directory.
Checks that the directory belongs to the given user, throws a forbidden error otherwise.
*/
export const getUserDirectoryById = async (
    userId: number,
    directoryId: number
) => {
    const directories = await db
        .select()
        .from(tables.directories)
        .where(eq(tables.directories.id, directoryId));
    const directory = directories[0];
    if (directory && directory.userId !== userId) {
        throw new ForbiddenError('Directory does not belong to the user');
    }
    if (directory) {
        return directory;
    }
    return null;
};

/**
Gets an directory.
Checks that the directory belongs to the given user, throws a forbidden error otherwise.
If directory does not exist throws a not found error.
*/
export const getUserDirectoryByIdOrThrow = async (
    userId: number,
    directoryId: number
) => {
    const directory = await getUserDirectoryById(userId, directoryId);
    if (!directory) {
        throw new NotFoundError('Directory not found');
    }
    return directory;
};

/**
Creates a directory.
*/
export const createDirectory = async (data: DirectoryInsert) => {
    const createdDirectories = await db
        .insert(tables.directories)
        .values(data)
        .returning();
    const directory = createdDirectories[0];
    if (!directory) {
        throw new InternError('Could not retreive inserted directory');
    }
    return directory;
};

/**
Updates a directory with the given ID.
*/
export const updateDirectoryById = async (
    directoryId: number,
    data: DirectoryUpdate
) => {
    const updatedDirectories = await db
        .update(tables.directories)
        .set(data)
        .where(eq(tables.directories.id, directoryId))
        .returning();
    const directory = updatedDirectories[0];
    if (!directory) {
        throw new InternError('Could not retreive updated directory');
    }
    return directory;
};

/**
Deletes directory with given ID.
*/
export const deleteDirectoryById = async (directoryId: number) =>
    db.delete(tables.directories).where(eq(tables.directories.id, directoryId));

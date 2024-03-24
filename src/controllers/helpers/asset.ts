import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';
import {
    type File as FormidableFile,
    type Options as FormidableOptions
} from 'formidable';

import { mimeTypes, FileType, MimeType } from '../../types/asset.js';
import { Directory } from '../../drizzle/schema.js';
import { db, tables } from '../../services/db.js';
import { getEnv } from '../../services/env.js';
import {
    ForbiddenError,
    InternError,
    NotFoundError,
    ValidationError
} from '../../services/errors.js';

// controls form's file mimetype extension, and size
// returns file type (image or audio)
export const controlFile = (
    file: FormidableFile,
    fileType?: FileType
): FileType => {
    const { mimetype, originalFilename } = file;
    const ext = originalFilename?.split('.').pop() ?? '';
    // There's a bug in formidable@v2 where maxFileSize option is applied to
    // all files and not each file so we have to control each file size ourself
    const limitSize = getEnv('ASSET_MAX_SIZE_MB_PER_FILE') * 1024 * 1024;
    if (file.size <= limitSize) {
        if (mimetype) {
            const mimeTypeData = mimeTypes[mimetype as MimeType];
            // fileType
            if (mimeTypeData && (!fileType || mimeTypeData.type === fileType)) {
                const { extensions, type } = mimeTypes[mimetype as MimeType];
                if (extensions.includes(ext)) {
                    return type as FileType;
                }
                throw new ValidationError(
                    `Extension of file ${originalFilename} ${ext} does not match mimetype ${mimetype}`
                );
            }
            throw new ValidationError(
                `Mimetype of file ${originalFilename} ${mimetype} is not allowed`
            );
        }
        throw new ValidationError(
            `Could not get mimetype of file ${originalFilename}`
        );
    }
    throw new ValidationError(
        `Size of file ${originalFilename} is to big (max ${getEnv(
            'ASSET_MAX_SIZE_MB_PER_FILE'
        )}Mb)`
    );
};

// check asset directory exists and is writable
export const getAssetDir = (): string => {
    const dir = getEnv('ASSET_DIR');
    try {
        fs.accessSync(dir, fs.constants.F_OK);
        fs.accessSync(dir, fs.constants.W_OK);
        return dir;
    } catch {
        throw new InternError(
            `Asset directory ${dir} does not exist or is not writable`
        );
    }
};

export const assetDir = getAssetDir();
export const assetTempDir = path.join(assetDir, 'tmp');

// create user subdirectory in asset dir if not exist and return its path
export const controlUserDir = async (userId: number): Promise<string> => {
    const userDir = path.join(assetDir, userId.toString());
    try {
        await fs.promises.access(userDir, fs.constants.F_OK);
    } catch {
        await fs.promises.mkdir(userDir);
    }
    return userDir;
};

// formidable initialization options
export const getFormidableOptions = (): FormidableOptions => ({
    uploadDir: assetTempDir,
    keepExtensions: false,
    maxFileSize: getEnv('ASSET_MAX_SIZE_MB') * 1024 * 1024,
    multiples: true
});

/**
Gets an asset.
*/
export const getAsset = async (assetId: number) => {
    const assets = await db
        .select()
        .from(tables.assets)
        .where(eq(tables.assets.id, assetId))
        .limit(1);
    return assets[0] ?? null;
};

/**
Gets an asset.
If asset does not exist throws a not found error.
*/
export const getAssetOrThrow = async (assetId: number) => {
    const asset = await getAsset(assetId);
    if (!asset) {
        throw new NotFoundError('Asset not found');
    }
    return asset;
};

/**
Gets an asset.
Checks that the asset belongs to the given user, throws a forbidden error otherwise.
If asset does not exist throws a not found error.
*/
export const getUserAssetOrThrow = async (assetId: number, userId: number) => {
    const asset = await getAssetOrThrow(assetId);
    if (asset.userId !== userId) {
        throw new ForbiddenError('Asset does not belong to you');
    }
    return asset;
};

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
export const getUserDirectory = async (directoryId: number, userId: number) => {
    const directories = await db
        .select()
        .from(tables.directories)
        .where(eq(tables.directories.id, directoryId))
        .limit(1);
    const directory = directories[0];
    if (directory && directory.userId !== userId) {
        throw new ForbiddenError('Directory does not belong to the user');
    }
    return directory ?? null;
};

/**
Gets an directory.
Checks that the directory belongs to the given user, throws a forbidden error otherwise.
If directory does not exist throws a not found error.
*/
export const getUserDirectoryOrThrow = async (
    directoryId: number,
    userId: number
) => {
    const directory = await getUserDirectory(directoryId, userId);
    if (!directory) {
        throw new NotFoundError('Directory not found');
    }
    return directory;
};

/**
Recursivly searches all children directories of a given directoryId.
*/
export const getChildrenDirectories = (
    directoryId: number,
    directories: Directory[]
): Directory[] => {
    const childrenDirs: Directory[] = [];
    directories.forEach((directory) => {
        if (directory.parentId === directoryId) {
            childrenDirs.push(
                ...[
                    directory,
                    ...getChildrenDirectories(directory.id, directories)
                ]
            );
        }
    });
    return childrenDirs;
};

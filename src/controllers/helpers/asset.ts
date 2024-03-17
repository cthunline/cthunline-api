import { Asset, Directory } from '@prisma/client';
import Formidable from 'formidable';
import Path from 'path';
import Fs from 'fs';

import { prisma } from '../../services/prisma.js';
import { getEnv } from '../../services/env.js';
import {
    ForbiddenError,
    InternError,
    ValidationError
} from '../../services/errors.js';

import { mimeTypes, FileType, MimeType } from '../../types/asset.js';

// controls form's file mimetype extension, and size
// returns file type (image or audio)
export const controlFile = (
    file: Formidable.File,
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
        Fs.accessSync(dir, Fs.constants.F_OK);
        Fs.accessSync(dir, Fs.constants.W_OK);
        return dir;
    } catch {
        throw new InternError(
            `Asset directory ${dir} does not exist or is not writable`
        );
    }
};

export const assetDir = getAssetDir();
export const assetTempDir = Path.join(assetDir, 'tmp');

// create user subdirectory in asset dir if not exist and return its path
export const controlUserDir = async (userId: number): Promise<string> => {
    const userDir = Path.join(assetDir, userId.toString());
    try {
        await Fs.promises.access(userDir, Fs.constants.F_OK);
    } catch {
        await Fs.promises.mkdir(userDir);
    }
    return userDir;
};

// formidable initialization options
export const getFormidableOptions = (): Formidable.Options => ({
    uploadDir: assetTempDir,
    keepExtensions: false,
    maxFileSize: getEnv('ASSET_MAX_SIZE_MB') * 1024 * 1024,
    multiples: true
});

export const getAsset = async (
    userId: number,
    assetId: number
): Promise<Asset> => {
    const asset = await prisma.asset.findFirstOrThrow({
        where: {
            id: assetId
        }
    });
    if (asset.userId !== userId) {
        throw new ForbiddenError('Asset does not belong to you');
    }
    return asset;
};

export const getDirectories = async (userId: number): Promise<Directory[]> =>
    prisma.directory.findMany({
        where: {
            userId
        }
    });

export const getDirectory = async (
    userId: number,
    directoryId: number
): Promise<Directory> => {
    const directory = await prisma.directory.findFirstOrThrow({
        where: {
            id: directoryId
        }
    });
    if (directory.userId !== userId) {
        throw new ForbiddenError('Directory does not belong to you');
    }
    return directory;
};

// recursivly searches all children directories of a given directoryId
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

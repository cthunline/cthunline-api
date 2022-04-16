import Fs from 'fs';
import Path from 'path';
import { Asset, Directory } from '@prisma/client';
import Formidable from 'formidable';

import { Prisma, handleNotFound } from './prisma';
import { configuration } from './configuration';
import { InternError, ValidationError } from './errors';
import { mimeTypes, FileType, MimeType } from '../types/asset';

const { ASSET_DIR } = configuration;

/* There's a bug in formidable@v2 where maxFileSize option is applied to
all files and not each file so we have to control each file size ourself */
export const maxEachFileSizeInMb = 20;
export const maxEachFileSize = maxEachFileSizeInMb * 1024 * 1024;

// controls form's file mimetype extension, and size
// returns file type (image or audio)
export const controlFile = (file: Formidable.File): FileType => {
    const { mimetype, originalFilename } = file;
    const ext = originalFilename?.split('.').pop() ?? '';
    if (file.size <= maxEachFileSize) {
        if (mimetype) {
            if (mimeTypes[mimetype as MimeType]) {
                const { extensions, type } = mimeTypes[mimetype as MimeType];
                if (extensions.includes(ext)) {
                    return type as FileType;
                }
                throw new ValidationError(
                    `Extension of file ${originalFilename} ${ext} does not match mimetype ${mimetype}`
                );
            }
            throw new ValidationError(`Mimetype of file ${originalFilename} ${mimetype} is not allowed`);
        }
        throw new ValidationError(`Could not get mimetype of file ${originalFilename}`);
    }
    throw new ValidationError(`Size of file ${originalFilename} is to big (max ${maxEachFileSizeInMb}Mb)`);
};

// check asset directory exists and is writable
export const getAssetDir = (): string => {
    const dir = ASSET_DIR;
    try {
        Fs.accessSync(dir, Fs.constants.F_OK);
        Fs.accessSync(dir, Fs.constants.W_OK);
        return dir;
    } catch {
        throw new InternError(`Asset directory ${dir} does not exist or is not writable`);
    }
};

export const assetDir = getAssetDir();
export const assetTempDir = Path.join(assetDir, 'tmp');

// create user subdirectory in asset dir if not exist and return its path
export const controlUserDir = async (userId: string): Promise<string> => {
    const userDir = Path.join(assetDir, userId);
    try {
        await Fs.promises.access(userDir, Fs.constants.F_OK);
    } catch {
        await Fs.promises.mkdir(userDir);
    }
    return userDir;
};

// formidable initialization options
export const formidableOptions: Formidable.Options = {
    uploadDir: assetTempDir,
    keepExtensions: false,
    maxFileSize: 100 * 1024 * 1024,
    multiples: true
};

export const getAsset = async (userId: string, assetId: string): Promise<Asset> => (
    handleNotFound<Asset>(
        'Asset', (
            Prisma.asset.findFirst({
                where: {
                    userId,
                    id: assetId
                }
            })
        )
    )
);

export const getDirectories = async (userId: string): Promise<Directory[]> => (
    Prisma.directory.findMany({
        where: {
            userId
        }
    })
);

export const getDirectory = async (
    userId: string,
    directoryId: string
): Promise<Directory> => (
    handleNotFound<Directory>(
        'Directory', (
            Prisma.directory.findFirst({
                where: {
                    userId,
                    id: directoryId
                }
            })
        )
    )
);

// recursivly searches all children directories of a given directoryId
export const getChildrenDirectories = (
    directoryId: string,
    directories: Directory[]
): Directory[] => {
    const childrenDirs: Directory[] = [];
    directories.forEach((directory) => {
        if (directory.parentId === directoryId) {
            childrenDirs.push(...[
                directory,
                ...getChildrenDirectories(directory.id, directories)
            ]);
        }
    });
    return childrenDirs;
};

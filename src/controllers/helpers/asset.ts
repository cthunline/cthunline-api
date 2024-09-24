import fs from 'node:fs';
import path from 'node:path';

import type { Directory } from '../../drizzle/schema.js';
import { getEnv } from '../../services/env.js';
import { InternError, ValidationError } from '../../services/errors.js';
import type {
    MultipartFileData,
    ParseMultipartBodyFileOptions
} from '../../services/multipart.js';
import { type FileType, type MimeType, mimeTypes } from '../../types/asset.js';

// controls form's file mimetype extension, and size
// returns file type (image or audio)
export const controlFile = (
    file: MultipartFileData,
    fileType?: FileType
): FileType => {
    const { mimeType, fileName } = file;
    const ext = fileName?.split('.').pop() ?? '';
    if (mimeType) {
        const mimeTypeData = mimeTypes[mimeType as MimeType];
        // fileType
        if (mimeTypeData && (!fileType || mimeTypeData.type === fileType)) {
            const { extensions, type } = mimeTypes[mimeType as MimeType];
            if (extensions.includes(ext)) {
                return type as FileType;
            }
            throw new ValidationError(
                `Extension of file ${fileName} ${ext} does not match mimetype ${mimeType}`
            );
        }
        throw new ValidationError(
            `Mimetype of file ${fileName} ${mimeType} is not allowed`
        );
    }
    throw new ValidationError(`Could not get mimetype of file ${fileName}`);
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

// multipart parsing options
export const getAssetMultipartOptions = (): ParseMultipartBodyFileOptions => ({
    tmpDir: assetTempDir,
    maxSizePerFile: getEnv('ASSET_MAX_SIZE_MB_PER_FILE') * 1024 * 1024,
    maxSizeTotal: getEnv('ASSET_MAX_SIZE_MB') * 1024 * 1024
});

/**
Recursivly searches all children directories of a given directoryId.
*/
export const getChildrenDirectories = (
    directoryId: number,
    directories: Directory[]
): Directory[] => {
    const childrenDirs: Directory[] = [];
    for (const directory of directories) {
        if (directory.parentId === directoryId) {
            childrenDirs.push(
                ...[
                    directory,
                    ...getChildrenDirectories(directory.id, directories)
                ]
            );
        }
    }
    return childrenDirs;
};

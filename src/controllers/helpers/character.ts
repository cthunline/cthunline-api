import { type Options as FormidableOptions } from 'formidable';
import path from 'path';
import fs from 'fs';

import { assetTempDir, getAssetDir } from './asset.js';
import { getEnv } from '../../services/env.js';

/**
Builds the cache key for character
*/
export const getCharacterCacheKey = (characterId: number) =>
    `character-${characterId}`;

export const portraitDirName = 'portraits';

export const getFormidablePortraitOptions = (): FormidableOptions => ({
    uploadDir: assetTempDir,
    keepExtensions: false,
    maxFileSize: getEnv('PORTRAIT_MAX_SIZE_MB') * 1024 * 1024,
    multiples: false
});

/**
Creates user subdirectory in asset dir if not exist and return its path.
*/
export const controlPortraitDir = async (): Promise<string> => {
    const dir = path.join(getAssetDir(), portraitDirName);
    try {
        await fs.promises.access(dir, fs.constants.F_OK);
    } catch {
        await fs.promises.mkdir(dir);
    }
    return dir;
};

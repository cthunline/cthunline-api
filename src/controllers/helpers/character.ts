import fs from 'node:fs';
import path from 'node:path';

import type { Character } from '../../drizzle/schema.js';
import { cache } from '../../services/cache.js';
import { getEnv } from '../../services/env.js';
import type { ParseMultipartBodyFileOptions } from '../../services/multipart.js';
import { assetTempDir, getAssetDir } from './asset.js';

/**
Builds the cache key for character
*/
export const getCharacterCacheKey = (characterId: number) =>
    `character-${characterId}`;

export const portraitDirName = 'portraits';

// multipart parsing options
export const getPortraitMultipartOptions =
    (): ParseMultipartBodyFileOptions => ({
        tmpDir: assetTempDir,
        maxSizePerFile: getEnv('PORTRAIT_MAX_SIZE_MB') * 1024 * 1024,
        maxSizeTotal: getEnv('PORTRAIT_MAX_SIZE_MB') * 1024 * 1024,
        maxFiles: 1
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

/**
Updates character in cache if exists.
*/
export const updateCachedCharacterIfExists = async (character: Character) => {
    const cacheKey = getCharacterCacheKey(character.id);
    const cachedCharacter = await cache.getJson<Character>(cacheKey);
    if (cachedCharacter) {
        await cache.setJson<Character>(cacheKey, character);
    }
};

/**
Deletes character in cache.
*/
export const deleteCachedCharacter = async (characterId: number) => {
    const cacheKey = getCharacterCacheKey(characterId);
    await cache.del(cacheKey);
};

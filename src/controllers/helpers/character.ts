import { type Options as FormidableOptions } from 'formidable';
import { eq } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

import { NotFoundError } from '../../services/errors.js';
import { assetTempDir, getAssetDir } from './asset.js';
import { db, tables } from '../../services/db.js';
import { getEnv } from '../../services/env.js';

/**
Builds the cache key for character
*/
export const getCharacterCacheKey = (characterId: number) =>
    `character-${characterId}`;

export const portraitDirName = 'portraits';

export const getCharacterById = async (characterId: number) => {
    const characters = await db
        .select()
        .from(tables.characters)
        .where(eq(tables.characters.id, characterId))
        .limit(1);
    return characters[0] ?? null;
};

export const getCharacterByIdOrThrow = async (characterId: number) => {
    const character = await getCharacterById(characterId);
    if (!character) {
        throw new NotFoundError('Character not found');
    }
    return character;
};

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

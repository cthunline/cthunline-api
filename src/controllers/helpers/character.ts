import { type Options as FormidableOptions } from 'formidable';
import { Character } from '@prisma/client';
import path from 'path';
import fs from 'fs';

import { assetTempDir, getAssetDir } from './asset.js';
import { prisma } from '../../services/prisma.js';
import { getEnv } from '../../services/env.js';

/**
Builds the cache key for character
*/
export const getCharacterCacheKey = (characterId: number) =>
    `character-${characterId}`;

export const portraitDirName = 'portraits';

export const getCharacter = async (characterId: number): Promise<Character> =>
    prisma.character.findUniqueOrThrow({
        where: {
            id: characterId
        }
    });

export const getFormidablePortraitOptions = (): FormidableOptions => ({
    uploadDir: assetTempDir,
    keepExtensions: false,
    maxFileSize: getEnv('PORTRAIT_MAX_SIZE_MB') * 1024 * 1024,
    multiples: false
});

// create user subdirectory in asset dir if not exist and return its path
export const controlPortraitDir = async (): Promise<string> => {
    const dir = path.join(getAssetDir(), portraitDirName);
    try {
        await fs.promises.access(dir, fs.constants.F_OK);
    } catch {
        await fs.promises.mkdir(dir);
    }
    return dir;
};

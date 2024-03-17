import { Character } from '@prisma/client';
import Formidable from 'formidable';
import Fs from 'fs';
import Path from 'path';

import { Prisma } from '../../services/prisma.js';
import { getEnv } from '../../services/env.js';
import { assetTempDir, getAssetDir } from './asset.js';

export const portraitDirName = 'portraits';

export const getCharacter = async (characterId: number): Promise<Character> =>
    Prisma.character.findUniqueOrThrow({
        where: {
            id: characterId
        }
    });

export const getFormidablePortraitOptions = (): Formidable.Options => ({
    uploadDir: assetTempDir,
    keepExtensions: false,
    maxFileSize: getEnv('PORTRAIT_MAX_SIZE_MB') * 1024 * 1024,
    multiples: false
});

// create user subdirectory in asset dir if not exist and return its path
export const controlPortraitDir = async (): Promise<string> => {
    const dir = Path.join(getAssetDir(), portraitDirName);
    try {
        await Fs.promises.access(dir, Fs.constants.F_OK);
    } catch {
        await Fs.promises.mkdir(dir);
    }
    return dir;
};

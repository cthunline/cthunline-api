import { Character } from '@prisma/client';

import { Prisma, handleNotFound } from '../prisma';
import { ValidationError } from '../errors';

import { isBase64 } from '../tools';
import { mimeTypes } from '../../types/asset';

export const imageMimeTypes = Object.entries(mimeTypes).filter(
    ([, { type }]) => type === 'image'
).map(
    ([mimeType]) => mimeType
);

export const portraitLimitSizeInKb = 500;
export const controlPortrait = (base64: string) => {
    if (!isBase64(base64, imageMimeTypes)) {
        throw new ValidationError('Portrait is not a valid base64 string');
    }
    const buffer = Buffer.from(base64);
    const sizeInKb = buffer.length / 1000;
    if (sizeInKb > portraitLimitSizeInKb) {
        throw new ValidationError(`Portrait is too big (max ${portraitLimitSizeInKb}Kb)`);
    }
};

export const getCharacter = async (characterId: number): Promise<Character> => (
    handleNotFound<Character>(
        'Character', (
            Prisma.character.findUnique({
                where: {
                    id: characterId
                }
            })
        )
    )
);

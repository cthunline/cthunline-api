import { type Static, Type } from '@sinclair/typebox';

import { multipartFileSchema } from '../../services/multipart.js';

export const createCharacterSchema = Type.Object(
    {
        gameId: Type.String({ minLength: 1 }),
        name: Type.String({ minLength: 1 }),
        data: Type.Object({}, { additionalProperties: true })
    },
    {
        additionalProperties: false
    }
);

export type CreateCharacterBody = Static<typeof createCharacterSchema>;

export const updateCharacterSchema = Type.Partial(
    Type.Omit(createCharacterSchema, ['gameId']),
    {
        additionalProperties: false,
        minProperties: 1
    }
);

export type UpdateCharacterBody = Static<typeof updateCharacterSchema>;

export const uploadPortraitSchema = Type.Object(
    {
        portrait: Type.Array(multipartFileSchema)
    },
    {
        additionalProperties: false
    }
);

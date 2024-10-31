import { Type } from '@fastify/type-provider-typebox';

import { multipartFileSchema } from './definitions.js';

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

export const updateCharacterSchema = Type.Partial(
    Type.Omit(createCharacterSchema, ['gameId']),
    {
        additionalProperties: false,
        minProperties: 1
    }
);

export const uploadPortraitFilesSchema = Type.Object(
    {
        portrait: Type.Array(multipartFileSchema)
    },
    {
        additionalProperties: false
    }
);

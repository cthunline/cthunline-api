import { Type } from '@fastify/type-provider-typebox';

import { sketchSchema } from './definitions.js';

export const createSessionSchema = Type.Object(
    {
        gameId: Type.String({ minLength: 1 }),
        name: Type.String({ minLength: 1 }),
        sketch: Type.Optional(sketchSchema)
    },
    {
        additionalProperties: false
    }
);

export const updateSessionSchema = Type.Partial(
    Type.Omit(createSessionSchema, ['gameId']),
    {
        additionalProperties: false,
        minProperties: 1
    }
);

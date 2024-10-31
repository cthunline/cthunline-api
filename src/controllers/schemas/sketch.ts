import { Type } from '@fastify/type-provider-typebox';

import { sketchSchema } from './definitions.js';

export const createSketchSchema = Type.Object(
    {
        name: Type.String({ minLength: 1 }),
        data: sketchSchema
    },
    {
        additionalProperties: false
    }
);

export const updateSketchSchema = Type.Partial(createSketchSchema, {
    additionalProperties: false,
    minProperties: 1
});

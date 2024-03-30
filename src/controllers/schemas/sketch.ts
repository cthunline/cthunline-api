import { Static, Type } from '@sinclair/typebox';

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

export type CreateSketchBody = Static<typeof createSketchSchema>;

export const updateSketchSchema = Type.Partial(createSketchSchema, {
    additionalProperties: false,
    minProperties: 1
});

export type UpdateSketchBody = Static<typeof updateSketchSchema>;

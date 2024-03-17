import { Static, Type } from '@sinclair/typebox';

import { sketchSchema } from './definitions.js';

export const createSketchSchema = Type.Object(
    {
        name: Type.String({ minLength: 1 }),
        sketch: sketchSchema
    },
    {
        additionalProperties: false
    }
);

export type CreateSketchBody = Static<typeof createSketchSchema>;

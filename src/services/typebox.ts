import type { TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

import { ValidationError } from './errors.js';

export const validateSchema = (schema: TSchema, data: unknown) => {
    const errors = [...Value.Errors(schema, data)];
    if (errors.length) {
        throw new ValidationError('Invalid data', errors);
    }
};

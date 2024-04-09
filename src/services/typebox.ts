import { Value } from '@sinclair/typebox/value';
import { type TSchema } from '@sinclair/typebox';

import { ValidationError } from './errors.js';

export const validateSchema = (schema: TSchema, data: any) => {
    const errors = [...Value.Errors(schema, data)];
    if (errors.length) {
        throw new ValidationError('Invalid data', errors);
    }
};

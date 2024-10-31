import type { Static, TSchema } from '@fastify/type-provider-typebox';
import { Value } from '@sinclair/typebox/value';

import { ValidationError } from './errors.js';

// Arrow function can not be used here as TS assertions only work with standard functions
export function validateSchema<T extends TSchema>(
    schema: T,
    data: unknown
): asserts data is Static<T> {
    const errors = [...Value.Errors(schema, data)];
    if (errors.length) {
        throw new ValidationError('Invalid data', errors);
    }
}

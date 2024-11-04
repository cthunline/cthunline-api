import {
    FormatRegistry as FastifyFormatRegistry,
    type Static,
    type TSchema
} from '@fastify/type-provider-typebox';
import { FormatRegistry } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';

import { ValidationError } from './errors.js';
import { formats } from './formats.js';

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

export const initTypeboxFormats = () => {
    for (const [name, regex] of Object.entries(formats)) {
        FormatRegistry.Set(name, (value) => regex.test(value));
        FastifyFormatRegistry.Set(name, (value) => regex.test(value));
    }
};

import { Type } from '@fastify/type-provider-typebox';

export const loginSchema = Type.Object(
    {
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 1 })
    },
    {
        additionalProperties: false
    }
);

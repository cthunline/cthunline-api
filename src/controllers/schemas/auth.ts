import { Static, Type } from '@sinclair/typebox';

export const loginSchema = Type.Object(
    {
        email: Type.String({ format: 'email' }),
        password: Type.String({ minLength: 1 })
    },
    {
        additionalProperties: false
    }
);

export type LoginBody = Static<typeof loginSchema>;

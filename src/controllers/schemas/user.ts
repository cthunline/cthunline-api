import { Type } from '@fastify/type-provider-typebox';

const fullUserSchema = Type.Object({
    name: Type.String({ minLength: 1 }),
    email: Type.String({ format: 'email' }),
    password: Type.String({ minLength: 6 }),
    oldPassword: Type.String({ minLength: 6 }),
    invitationCode: Type.Optional(Type.String({ minLength: 1 })),
    theme: Type.Optional(
        Type.Union([Type.Literal('dark'), Type.Literal('light')])
    ),
    locale: Type.Optional(Type.String({ minLength: 2, maxLength: 2 })),
    isAdmin: Type.Optional(Type.Boolean()),
    isEnabled: Type.Optional(Type.Boolean())
});

export const createUserSchema = Type.Omit(
    fullUserSchema,
    ['oldPassword', 'invitationCode', 'isEnabled'],
    {
        additionalProperties: false
    }
);

export const updateUserSchema = Type.Partial(
    Type.Omit(fullUserSchema, ['invitationCode']),
    {
        additionalProperties: false,
        minProperties: 1
    }
);

export const registerUserSchema = Type.Pick(
    fullUserSchema,
    ['name', 'email', 'password', 'invitationCode'],
    {
        additionalProperties: false
    }
);

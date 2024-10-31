import { Type } from '@fastify/type-provider-typebox';

export const createNoteSchema = Type.Object(
    {
        title: Type.String({ minLength: 1 }),
        text: Type.Optional(Type.String()),
        isShared: Type.Optional(Type.Boolean())
    },
    {
        additionalProperties: false
    }
);

export const updateNoteSchema = Type.Partial(createNoteSchema, {
    additionalProperties: false,
    minProperties: 1
});

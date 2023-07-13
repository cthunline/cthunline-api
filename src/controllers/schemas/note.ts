import { Static, Type } from '@sinclair/typebox';

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

export type CreateNoteBody = Static<typeof createNoteSchema>;

export const updateNoteSchema = Type.Partial(createNoteSchema, {
    additionalProperties: false,
    minProperties: 1
});

export type UpdateNoteBody = Static<typeof updateNoteSchema>;

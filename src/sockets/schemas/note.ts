import { type Static, Type } from '@sinclair/typebox';

export const noteSocketUpdateSchema = Type.Object(
    {
        noteId: Type.Integer({ minimum: 1 })
    },
    {
        additionalProperties: false
    }
);

export type NoteSocketUpdateBody = Static<typeof noteSocketUpdateSchema>;

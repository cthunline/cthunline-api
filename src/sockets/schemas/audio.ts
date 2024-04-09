import { type Static, Type } from '@sinclair/typebox';

export const playAudioSchema = Type.Object(
    {
        assetId: Type.Integer({ minimum: 1 }),
        time: Type.Optional(Type.Number({ minimum: 0 }))
    },
    {
        additionalProperties: false,
        minProperties: 1
    }
);

export type PlayAudioBody = Static<typeof playAudioSchema>;

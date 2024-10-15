import { type Static, Type } from '@sinclair/typebox';

export const requestDiceSchema = Type.Partial(
    Type.Object({
        D4: Type.Integer({ minimum: 1 }),
        D6: Type.Integer({ minimum: 1 }),
        D8: Type.Integer({ minimum: 1 }),
        D10: Type.Integer({ minimum: 1 }),
        D12: Type.Integer({ minimum: 1 }),
        D20: Type.Integer({ minimum: 1 }),
        D100: Type.Integer({ minimum: 1 })
    }),
    {
        additionalProperties: false,
        minProperties: 1
    }
);

export type RequestDiceBody = Static<typeof requestDiceSchema>;

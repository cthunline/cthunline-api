import { type Static, Type } from '@fastify/type-provider-typebox';

import { diceTypes } from '../../services/dice.js';

const diceSchema = Type.Union(diceTypes.map((dice) => Type.Literal(dice)));

const diceRequestRollSchema = Type.Object(
    {
        dice: diceSchema,
        color: Type.Optional(Type.String({ minLength: 1 }))
    },
    {
        additionalProperties: false,
        minProperties: 1
    }
);

export type DiceRequestRoll = Static<typeof diceRequestRollSchema>;

export const diceRequestSchema = Type.Object(
    {
        rolls: Type.Array(diceRequestRollSchema, {
            minItems: 1
        })
    },
    {
        additionalProperties: false,
        minProperties: 1
    }
);

export type DiceRequestBody = Static<typeof diceRequestSchema>;

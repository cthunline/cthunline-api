import { type Static, Type } from '@fastify/type-provider-typebox';

import { diceTypes } from '../../services/dice.js';

// -------------------------- standard rolls

const diceRequestRollSchema = Type.Object(
    {
        dice: Type.Union(diceTypes.map((dice) => Type.Literal(dice)))
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

// -------------------------- game rolls

export const alienRollSchema = Type.Object(
    {
        dices: Type.Integer({ minimum: 1 }),
        stresses: Type.Integer({ minimum: 0 })
    },
    {
        additionalProperties: false,
        minProperties: 1
    }
);

export type AlienRollRequest = Static<typeof alienRollSchema>;

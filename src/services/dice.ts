import { randomInt } from 'node:crypto';

import type { SafeUser } from '../drizzle/schema.js';
import type {
    AlienRollRequest,
    DiceRequestBody,
    DiceRequestRoll
} from '../sockets/schemas/dice.js';
import type {
    AlienDiceResult,
    AlienDiceRoll,
    AlienRollResult,
    DiceAggregatedRolls,
    DiceResult,
    DiceType,
    SocketDiceResult
} from '../types/dice.js';

export const diceTypes = [
    'D4',
    'D6',
    'D8',
    'D10',
    'D12',
    'D20',
    'D100'
] as const satisfies DiceType[];

export const diceValues = new Map<DiceType, number>(
    diceTypes.map((dType) => [dType, Number.parseInt(dType.substring(1))])
);

const sortDiceRequestRolls = <T extends DiceRequestRoll>(rolls: T[]): T[] =>
    rolls.toSorted(
        (a, b) => (diceValues.get(a.dice) ?? 0) - (diceValues.get(b.dice) ?? 0)
    );

const getDiceMax = (diceType: DiceType): number =>
    Number.parseInt(diceType.replace('D', ''));

const rollDice = (diceType: DiceType): number =>
    randomInt(getDiceMax(diceType)) + 1;

export const getDiceResult = (
    user: SafeUser,
    isMaster: boolean,
    { rolls }: DiceRequestBody,
    isPrivate = false
): SocketDiceResult => {
    const sortedRolls = sortDiceRequestRolls(rolls);
    const aggregatedRolls: DiceAggregatedRolls = {};
    const results: DiceResult[] = [];
    let total = 0;
    for (const dReq of sortedRolls) {
        aggregatedRolls[dReq.dice] = (aggregatedRolls[dReq.dice] ?? 0) + 1;
        const result = rollDice(dReq.dice);
        results.push({ ...dReq, result });
        total += result;
    }
    return {
        user,
        isMaster,
        rolls,
        aggregatedRolls,
        isPrivate,
        total,
        results
    };
};

export const getAlienRollResult = (
    user: SafeUser,
    isMaster: boolean,
    { dices, stresses }: AlienRollRequest,
    isPrivate = false
): AlienRollResult => {
    const rolls: AlienDiceRoll[] = [
        ...Array(dices)
            .keys()
            .map(() => ({ dice: 'D6' as const, stress: false })),
        ...Array(stresses)
            .keys()
            .map(() => ({ dice: 'D6' as const, stress: true }))
    ];
    const results: AlienDiceResult[] = [];
    let successes = 0;
    let panics = 0;
    for (const { dice, stress } of rolls) {
        const result = rollDice(dice);
        results.push({ dice, stress, result });
        if (result === 6) {
            successes += 1;
        } else if (stress && result === 1) {
            panics += 1;
        }
    }
    return {
        user,
        isMaster,
        isPrivate,
        dices,
        stresses,
        successes,
        panics,
        results
    };
};

import type { DiceType } from '../types/dice.js';

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

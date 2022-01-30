export enum DiceType {
    d4 = 'd4',
    d6 = 'd6',
    d8 = 'd8',
    d12 = 'd12',
    d20 = 'd20',
    d100 = 'd100'
}

export type DiceRequest = Record<DiceType, number>;

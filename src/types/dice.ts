import { User } from '@prisma/client';

export enum DiceType {
    d4 = 'd4',
    d6 = 'd6',
    d8 = 'd8',
    d10 = 'd10',
    d12 = 'd12',
    d20 = 'd20',
    d100 = 'd100'
}

export type DiceRequest = Partial<Record<DiceType, number>>;

export interface DiceResult {
    user: User
    request: DiceRequest
    result: number
}

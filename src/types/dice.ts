import type { SafeUser } from '../drizzle/schema.js';
import type { DiceRequestRoll } from '../sockets/schemas/dice.js';

export type DiceType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20' | 'D100';

export type DiceResult = DiceRequestRoll & {
    result: number;
};

export type DiceAggregatedRolls = Partial<Record<DiceType, number>>;

export interface SocketDiceResult {
    user: SafeUser;
    isMaster: boolean;
    rolls: DiceRequestRoll[];
    aggregatedRolls: DiceAggregatedRolls;
    total: number;
    results: DiceResult[];
    isPrivate: boolean;
}

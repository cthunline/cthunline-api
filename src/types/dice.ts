import type { SafeUser } from '../drizzle/schema.js';
import type {
    AlienRollRequest,
    DiceRequestRoll
} from '../sockets/schemas/dice.js';

// -------------------------- standard rolls

export type DiceType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20' | 'D100';

export type DiceResult = DiceRequestRoll & {
    result: number;
};

export type DiceAggregatedRolls = Partial<Record<DiceType, number>>;

type SocketCommonDiceResultData = {
    user: SafeUser;
    isMaster: boolean;
    isPrivate: boolean;
};

export type SocketDiceResult = SocketCommonDiceResultData & {
    rolls: DiceRequestRoll[];
    aggregatedRolls: DiceAggregatedRolls;
    total: number;
    results: DiceResult[];
};

// -------------------------- game rolls

export type AlienDiceRoll = DiceRequestRoll & {
    stress: boolean;
};

export type AlienDiceResult = AlienDiceRoll & {
    result: number;
};

export type AlienRollResult = SocketCommonDiceResultData &
    AlienRollRequest & {
        successes: number;
        panics: number;
        results: AlienDiceResult[];
    };

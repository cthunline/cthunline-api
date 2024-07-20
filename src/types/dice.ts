import type { RequestDiceBody } from '../sockets/schemas/dice.js';

import type { SafeUser } from '../drizzle/schema.js';

export type DiceType = 'D4' | 'D6' | 'D8' | 'D10' | 'D12' | 'D20' | 'D100';

export interface SocketDiceResult {
    user: SafeUser;
    isMaster: boolean;
    request: RequestDiceBody;
    result: number;
    isPrivate: boolean;
}

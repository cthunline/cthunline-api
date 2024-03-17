import { RequestDiceBody } from '../sockets/schemas/dice.js';

import { SafeUser } from './user.js';

export enum DiceType {
    d4 = 'D4',
    d6 = 'D6',
    d8 = 'D8',
    d10 = 'D10',
    d12 = 'D12',
    d20 = 'D20',
    d100 = 'D100'
}

export interface SocketDiceResult {
    user: SafeUser;
    isMaster: boolean;
    request: RequestDiceBody;
    result: number;
    isPrivate: boolean;
}

import { User } from '@prisma/client';

import { DiceType } from './dice';

export type SocketDiceRequest = Partial<Record<DiceType, number>>;

export interface SocketDiceResult {
    user: User,
    request: SocketDiceRequest,
    result: number
}

export interface SocketAudioPlay {
    assetId: string
    time?: number;
}

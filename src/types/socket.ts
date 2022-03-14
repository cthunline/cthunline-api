import { User } from '@prisma/client';

import { DiceType } from './dice';

export type SocketDiceRequest = Partial<Record<DiceType, number>>;

export interface SocketDiceResult {
    user: User;
    isMaster: boolean;
    request: SocketDiceRequest;
    result: number;
    isPrivate: boolean;
}

export interface SocketAudioPlay {
    assetId: string;
    time?: number;
}

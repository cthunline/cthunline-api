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
    assetId: number;
    time?: number;
}

export interface SketchData {
    displayed: boolean;
    paths: string[];
    images: SketchImageData[];
    tokens: SketchTokenData[];
}

export interface SketchImageData {
    id: string;
    index: number;
    url: string;
    width: number;
    height: number;
    x: number;
    y: number;
}

export interface SketchTokenData {
    id: string;
    index: number;
    color: string;
    attachedData: SketchTokenAttachedData | null;
    x: number;
    y: number;
    tooltipPlacement: string;
}

export interface SketchTokenAttachedData {
    userId: number;
    userName: string;
    characterId: number;
    characterName: string;
}

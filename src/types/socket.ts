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

export interface SketchData {
    displayed: boolean;
    paths: string[];
    images: SketchImageData[];
    events: SketchEvent[];
}

export interface SketchImageData {
    url: string;
    width: number;
    height: number;
    x: number;
    y: number;
}

export interface SketchEvent {
    type: string;
    imageIndex?: number;
    imageData?: SketchImageData;
}

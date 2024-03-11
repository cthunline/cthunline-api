import { type Server, type Socket } from 'socket.io';
import { type Session, type Character, type Asset } from '@prisma/client';

import {
    type TokenBody,
    type SketchBody
} from '../controllers/schemas/definitions';
import { type RequestDiceBody } from '../sockets/schemas/dice';
import { type PlayAudioBody } from '../sockets/schemas/audio';
import { type SocketMeta } from '../sockets/helper';
import { type SocketDiceResult } from './dice';
import { type SafeUser } from './user';

export interface ListenEvents {
    sketchUpdate: (data: SketchBody) => void;
    tokenUpdate: (data: TokenBody) => void;
    diceRequest: (data: RequestDiceBody) => void;
    dicePrivateRequest: (data: RequestDiceBody) => void;
    audioPlay: (data: PlayAudioBody) => void;
    audioStop: () => void;
    characterUpdate: () => void;
}

export interface EmitEvents {
    error: (data: unknown) => void;
    join: (data: SocketConnectData) => void;
    leave: (data: SocketConnectData) => void;
    sketchUpdate: (data: SocketSketchUpdateData) => void;
    diceResult: (data: SocketDiceResultData) => void;
    audioPlay: (data: SocketAudioPlayData) => void;
    audioStop: (data: SocketBaseData) => void;
    characterUpdate: (data: SocketCharacterUpdateData) => void;
}

export interface ServerSideEvents {
    //
}

export type SocketData = {
    cookies: { [key: string]: string };
    user: SafeUser;
    sessionId: number;
    session: Session;
} & (
    | {
          isMaster: true;
          characterId: null;
          character: null;
      }
    | {
          isMaster: false;
          characterId: number;
          character: Character;
      }
);

export type SocketIoServer = Server<
    ListenEvents,
    EmitEvents,
    ServerSideEvents,
    SocketData
>;

export type SocketIoSocket = Socket<
    ListenEvents,
    EmitEvents,
    ServerSideEvents,
    SocketData
>;

export type SocketBaseData = {
    user: SafeUser;
    isMaster: boolean;
};

export type SocketSessionUser = SafeUser & {
    socketId: string;
} & (
        | {
              isMaster: true;
              character: null;
          }
        | {
              isMaster: false;
              character: Character;
          }
    );

export type SocketConnectData = SocketMeta<
    SocketBaseData & {
        users: SocketSessionUser[];
    }
>;

export type SocketSketchUpdateData = SocketMeta<
    SocketBaseData & {
        sketch: SketchBody;
    }
>;

export type SocketDiceResultData = SocketMeta<SocketDiceResult>;

export type SocketAudioPlayData = SocketMeta<
    SocketBaseData & {
        asset: Asset;
        time?: number;
    }
>;

export type SocketCharacterUpdateData = SocketMeta<
    SocketBaseData & {
        character: Character;
    }
>;

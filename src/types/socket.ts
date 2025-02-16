import type { Server, Socket } from 'socket.io';

import type {
    SketchBody,
    TokenBody
} from '../controllers/schemas/definitions.js';
import type {
    Asset,
    Character,
    Note,
    SafeUser,
    Session
} from '../drizzle/schema.js';
import type { SocketMeta } from '../sockets/helper.js';
import type { PlayAudioBody } from '../sockets/schemas/audio.js';
import type { DiceRequestBody } from '../sockets/schemas/dice.js';
import type { NoteSocketUpdateBody } from '../sockets/schemas/note.js';
import type { SocketDiceResult } from './dice.js';

export interface ListenEvents {
    sketchUpdate: (data: SketchBody) => void;
    tokenUpdate: (data: TokenBody) => void;
    diceRequest: (data: DiceRequestBody) => void;
    dicePrivateRequest: (data: DiceRequestBody) => void;
    audioPlay: (data: PlayAudioBody) => void;
    audioStop: () => void;
    characterUpdate: () => void;
    noteUpdate: (data: NoteSocketUpdateBody) => void;
    noteDelete: (data: NoteSocketUpdateBody) => void;
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
    noteUpdate: (data: SocketNoteUpdateData) => void;
    noteDelete: (data: SocketNoteDeleteData) => void;
}

export type ServerSideEvents = object;

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

export type SocketNoteUpdateData = SocketMeta<
    SocketBaseData & {
        note: Note;
    }
>;

export type SocketNoteDeleteData = SocketMeta<
    SocketBaseData & {
        noteId: number;
    }
>;

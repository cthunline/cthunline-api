import { type Static, Type } from '@sinclair/typebox';

export const assetIdSchema = Type.Object(
    {
        assetId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type AssetIdParams = Static<typeof assetIdSchema>;

export const characterIdSchema = Type.Object(
    {
        characterId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type CharacterIdParams = Static<typeof characterIdSchema>;

export const directoryIdSchema = Type.Object(
    {
        directoryId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type DirectoryIdParams = Static<typeof directoryIdSchema>;

export const gameIdSchema = Type.Object(
    {
        gameId: Type.String()
    },
    {
        additionalProperties: false
    }
);

export type GameIdParams = Static<typeof gameIdSchema>;

export const noteIdSchema = Type.Object(
    {
        noteId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type NoteIdParams = Static<typeof noteIdSchema>;

export const noteActionSchema = Type.Object(
    {
        action: Type.Union([Type.Literal('up'), Type.Literal('down')])
    },
    {
        additionalProperties: false
    }
);

export type NoteActionParams = Static<typeof noteActionSchema>;

export const sessionIdSchema = Type.Object(
    {
        sessionId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type SessionIdParams = Static<typeof sessionIdSchema>;

export const sketchIdSchema = Type.Object(
    {
        sketchId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type SketchIdParams = Static<typeof sketchIdSchema>;

export const userIdSchema = Type.Object(
    {
        userId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type UserIdParams = Static<typeof userIdSchema>;

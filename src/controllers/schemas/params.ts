import { type Static, Type } from '@sinclair/typebox';

export const assetIdParamSchema = Type.Object(
    {
        assetId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type AssetIdParam = Static<typeof assetIdParamSchema>;

export const characterIdParamSchema = Type.Object(
    {
        characterId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type CharacterIdParam = Static<typeof characterIdParamSchema>;

export const directoryIdParamSchema = Type.Object(
    {
        directoryId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type DirectoryIdParam = Static<typeof directoryIdParamSchema>;

export const gameIdParamSchema = Type.Object(
    {
        gameId: Type.String()
    },
    {
        additionalProperties: false
    }
);

export type GameIdParam = Static<typeof gameIdParamSchema>;

export const noteIdParamSchema = Type.Object(
    {
        noteId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type NoteIdParam = Static<typeof noteIdParamSchema>;

export const noteActionParamSchema = Type.Object(
    {
        action: Type.Union([Type.Literal('up'), Type.Literal('down')])
    },
    {
        additionalProperties: false
    }
);

export type NoteActionParam = Static<typeof noteActionParamSchema>;

export const sessionIdParamSchema = Type.Object(
    {
        sessionId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type SessionIdParam = Static<typeof sessionIdParamSchema>;

export const sketchIdParamSchema = Type.Object(
    {
        sketchId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type SketchIdParam = Static<typeof sketchIdParamSchema>;

export const userIdParamSchema = Type.Object(
    {
        userId: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type UserIdParam = Static<typeof userIdParamSchema>;

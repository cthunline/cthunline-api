import { Type } from '@fastify/type-provider-typebox';

export const assetIdParamSchema = Type.Object(
    {
        assetId: Type.Integer()
    },
    {
        additionalProperties: false
    }
);

export const characterIdParamSchema = Type.Object(
    {
        characterId: Type.Integer()
    },
    {
        additionalProperties: false
    }
);

export const directoryIdParamSchema = Type.Object(
    {
        directoryId: Type.Integer()
    },
    {
        additionalProperties: false
    }
);

export const gameIdParamSchema = Type.Object(
    {
        gameId: Type.String()
    },
    {
        additionalProperties: false
    }
);

export const noteIdParamSchema = Type.Object(
    {
        noteId: Type.Integer()
    },
    {
        additionalProperties: false
    }
);

export const noteActionParamSchema = Type.Object(
    {
        action: Type.Union([Type.Literal('up'), Type.Literal('down')])
    },
    {
        additionalProperties: false
    }
);

export const sessionIdParamSchema = Type.Object(
    {
        sessionId: Type.Integer()
    },
    {
        additionalProperties: false
    }
);

export const sketchIdParamSchema = Type.Object(
    {
        sketchId: Type.Integer()
    },
    {
        additionalProperties: false
    }
);

export const userIdParamSchema = Type.Object(
    {
        userId: Type.Integer()
    },
    {
        additionalProperties: false
    }
);

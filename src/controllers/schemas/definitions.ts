import { type Static, type TSchema, Type } from '@sinclair/typebox';

import type { MultipartFileData } from '../../services/multipart.js';

export const drawingPathSchema = Type.Object(
    {
        id: Type.String({ minLength: 1 }),
        d: Type.String({ minLength: 1 }),
        color: Type.String({ minLength: 1 }),
        width: Type.Integer({ minimum: 1 })
    },
    {
        additionalProperties: false
    }
);

export type DrawingPathBody = Static<typeof drawingPathSchema>;

export const imageSchema = Type.Object(
    {
        id: Type.String({ minLength: 1 }),
        index: Type.Integer({ minimum: 0 }),
        url: Type.String({ minLength: 1 }),
        width: Type.Number({ minimum: 0 }),
        height: Type.Number({ minimum: 0 }),
        x: Type.Number(),
        y: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export type ImageBody = Static<typeof imageSchema>;

export const textSchema = Type.Object(
    {
        id: Type.String({ minLength: 1 }),
        index: Type.Integer({ minimum: 0 }),
        text: Type.String({ minLength: 1 }),
        fontSize: Type.Integer({ minimum: 1 }),
        color: Type.String({ minLength: 1 }),
        x: Type.Number(),
        y: Type.Number()
    },
    {
        additionalProperties: false
    }
);

export const tokenSchema = Type.Object(
    {
        id: Type.String({ minLength: 1 }),
        index: Type.Integer({ minimum: 0 }),
        color: Type.String({ minLength: 1 }),
        x: Type.Number(),
        y: Type.Number(),
        attachedData: Type.Union([
            Type.Object(
                {
                    userId: Type.Integer({ minimum: 1 }),
                    userName: Type.String({ minLength: 1 }),
                    characterId: Type.Integer({ minimum: 1 }),
                    characterName: Type.String({ minLength: 1 })
                },
                {
                    additionalProperties: false
                }
            ),
            Type.Null()
        ]),
        tooltipPlacement: Type.Optional(
            Type.Union([
                Type.Literal('top'),
                Type.Literal('left'),
                Type.Literal('bottom'),
                Type.Literal('right')
            ])
        )
    },
    {
        additionalProperties: false
    }
);

export type TokenBody = Static<typeof tokenSchema>;

export type TextBody = Static<typeof textSchema>;

export const sketchSchema = Type.Object(
    {
        displayed: Type.Boolean(),
        paths: Type.Array(drawingPathSchema),
        images: Type.Array(imageSchema),
        texts: Type.Array(textSchema),
        tokens: Type.Array(tokenSchema)
    },
    {
        additionalProperties: false
    }
);

export type SketchBody = Static<typeof sketchSchema>;
export type Sketch = SketchBody;

export const multipartFileSchema = Type.Object(
    {
        mimeType: Type.String(),
        fileName: Type.String(),
        filePath: Type.String()
    } satisfies Record<keyof MultipartFileData, TSchema>,
    {
        additionalProperties: false
    }
);

export const emptyObjectSchema = Type.Object(
    {},
    {
        additionalProperties: false
    }
);

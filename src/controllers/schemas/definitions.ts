import { Static, Type } from '@sinclair/typebox';

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

export const sketchSchema = Type.Object(
    {
        displayed: Type.Boolean(),
        paths: Type.Array(Type.String({ minLength: 1 })),
        images: Type.Array(imageSchema),
        tokens: Type.Optional(Type.Array(tokenSchema))
    },
    {
        additionalProperties: false
    }
);

export type SketchBody = Static<typeof sketchSchema>;

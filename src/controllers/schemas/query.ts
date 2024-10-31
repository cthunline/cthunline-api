import { Type } from '@fastify/type-provider-typebox';

import type { FileType } from '../../types/asset.js';

export const assetTypeQuerySchema = Type.Partial(
    Type.Object({
        type: Type.Union([Type.Literal('image'), Type.Literal('audio')])
    })
);

export type AssetTypeQuery = {
    type?: FileType;
};

export const userQuerySchema = Type.Partial(
    Type.Object({
        user: Type.Integer()
    })
);

export const disabledQuerySchema = Type.Partial(
    Type.Object({
        disabled: Type.Boolean()
    })
);

import { type Static, Type } from '@sinclair/typebox';

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
        user: Type.Number()
    })
);

export type UserQuery = Static<typeof userQuerySchema>;

export const disabledQuerySchema = Type.Partial(
    Type.Object({
        disabled: Type.Boolean()
    })
);

export type DisabledQuery = Static<typeof disabledQuerySchema>;

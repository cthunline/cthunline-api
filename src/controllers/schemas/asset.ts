import { Type } from '@fastify/type-provider-typebox';

import { multipartFileSchema } from './definitions.js';

export const uploadAssetsFilesSchema = Type.Object(
    {
        assets: Type.Array(multipartFileSchema)
    },
    {
        additionalProperties: false
    }
);

export const uploadAssetsFieldsSchema = Type.Object(
    {
        directoryId: Type.Optional(Type.RegExp(/^\d+$/))
    },
    {
        additionalProperties: false
    }
);

export const createDirectorySchema = Type.Object(
    {
        name: Type.String({ minLength: 1 }),
        parentId: Type.Optional(Type.Integer({ minimum: 1 }))
    },
    {
        additionalProperties: false
    }
);

export const updateDirectorySchema = Type.Partial(
    Type.Pick(createDirectorySchema, ['name']),
    {
        additionalProperties: false,
        minProperties: 1
    }
);

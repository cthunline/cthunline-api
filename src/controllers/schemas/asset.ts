import { Static, Type } from '@sinclair/typebox';

export const uploadAssetsSchema = Type.Object(
    {
        assets: Type.Any(),
        directoryId: Type.Optional(Type.RegExp(/^[0-9]+$/))
    },
    {
        additionalProperties: false
    }
);

export type UploadAssetsBody = Static<typeof uploadAssetsSchema>;

export const uploadAssetsFieldsSchema = Type.Omit(uploadAssetsSchema, [
    'assets'
]);

export const createDirectorySchema = Type.Object(
    {
        name: Type.String({ minLength: 1 }),
        parentId: Type.Optional(Type.Integer({ minimum: 1 }))
    },
    {
        additionalProperties: false
    }
);

export type CreateDirectoryBody = Static<typeof createDirectorySchema>;

export const updateDirectorySchema = Type.Partial(
    Type.Pick(createDirectorySchema, ['name']),
    {
        additionalProperties: false,
        minProperties: 1
    }
);

export type UpdateDirectoryBody = Static<typeof updateDirectorySchema>;

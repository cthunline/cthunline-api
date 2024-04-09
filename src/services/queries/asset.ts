import { eq, and, getTableColumns, inArray } from 'drizzle-orm';

import { ForbiddenError, NotFoundError } from '../../services/errors.js';
import { type AssetInsert } from '../../drizzle/schema.js';
import { db, tables } from '../../services/db.js';

/**
Gets user assets including directories data.
Assets can be filtered by type.
*/
export const getUserAssets = async (userId: number, type?: string) =>
    db
        .select({
            ...getTableColumns(tables.assets),
            directory: getTableColumns(tables.directories)
        })
        .from(tables.assets)
        .where(
            and(
                eq(tables.assets.userId, userId),
                type ? eq(tables.assets.type, String(type)) : undefined
            )
        )
        .leftJoin(
            tables.directories,
            eq(tables.assets.directoryId, tables.directories.id)
        );

/**
Get assets belonging to the given directory IDs.
*/
export const getUserDirectoriesAssets = async (
    userId: number,
    directoryIds: number[]
) =>
    db
        .select()
        .from(tables.assets)
        .where(
            and(
                eq(tables.assets.userId, userId),
                inArray(tables.assets.directoryId, directoryIds)
            )
        );

/**
Gets an asset.
*/
export const getAssetById = async (assetId: number) => {
    const assets = await db
        .select()
        .from(tables.assets)
        .where(eq(tables.assets.id, assetId));
    if (assets[0]) {
        return assets[0];
    }
    return null;
};

/**
Gets an asset.
If asset does not exist throws a not found error.
*/
export const getAssetByIdOrThrow = async (assetId: number) => {
    const asset = await getAssetById(assetId);
    if (!asset) {
        throw new NotFoundError('Asset not found');
    }
    return asset;
};

/**
Gets an asset.
Checks that the asset belongs to the given user, throws a forbidden error otherwise.
If asset does not exist throws a not found error.
*/
export const getUserAssetByIdOrThrow = async (
    userId: number,
    assetId: number
) => {
    const asset = await getAssetByIdOrThrow(assetId);
    if (asset.userId !== userId) {
        throw new ForbiddenError('Asset does not belong to you');
    }
    return asset;
};

/**
Creates many assets.
*/
export const createAssets = async (data: AssetInsert[]) =>
    db.insert(tables.assets).values(data).returning();

/**
Deletes an asset with given ID.
*/
export const deleteAssetById = async (assetId: number) =>
    db.delete(tables.assets).where(eq(tables.assets.id, assetId));

/**
Deletes many assets with given IDs.
*/
export const deleteAssetsByIds = async (assetIds: number[]) =>
    db.delete(tables.assets).where(inArray(tables.assets.id, assetIds));

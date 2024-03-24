import { eq, and } from 'drizzle-orm';

import { NotFoundError } from '../../services/errors.js';
import { type Sketch } from '../schemas/definitions.js';
import { db, tables } from '../../services/db.js';

/**
Builds the cache key for play sketch
*/
export const getSketchCacheKey = (sessionId: number) => `sketch-${sessionId}`;

export const defaultSketchData: Sketch = {
    displayed: false,
    paths: [],
    images: [],
    tokens: []
};

export const getUserSketchOrThrow = async (
    sketchId: number,
    userId: number
) => {
    const sketchs = await db
        .select()
        .from(tables.sketchs)
        .where(
            and(
                eq(tables.sketchs.id, sketchId),
                eq(tables.sketchs.userId, userId)
            )
        )
        .limit(1);
    const sketch = sketchs[0];
    if (!sketch) {
        throw new NotFoundError('Sketch not found');
    }
    return sketch;
};

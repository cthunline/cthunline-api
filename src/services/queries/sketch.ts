import { and, eq } from 'drizzle-orm';

import type { SketchInsert, SketchUpdate } from '../../drizzle/schema.js';
import { db, tables } from '../../services/db.js';
import {
    ForbiddenError,
    InternError,
    NotFoundError
} from '../../services/errors.js';

/**
Gets sketchs belonging to the given user.
*/
export const getUserSessionSketchs = async (
    userId: number,
    sessionId: number
) =>
    db
        .select()
        .from(tables.sketchs)
        .where(
            and(
                eq(tables.sketchs.userId, userId),
                eq(tables.sketchs.sessionId, sessionId)
            )
        );

/**
Gets a sketch by ID.
Throws a NotFoundError if it does not exist.
*/
export const getSketchByIdOrThrow = async (sketchId: number) => {
    const sketchs = await db
        .select()
        .from(tables.sketchs)
        .where(eq(tables.sketchs.id, sketchId));
    const sketch = sketchs[0];
    if (!sketch) {
        throw new NotFoundError('Sketch not found');
    }
    return sketch;
};

/**
Gets a sketch by ID.
Controls if the sketch belongs to the given user, throws a ForbiddenError otherwise.
Throws a NotFoundError if it does not exist.
*/
export const getUserSketchByIdOrThrow = async (
    userId: number,
    sketchId: number
) => {
    const sketch = await getSketchByIdOrThrow(sketchId);
    if (sketch.userId !== userId) {
        throw new ForbiddenError('Sketch does not belong to you');
    }
    return sketch;
};

/**
Creates a sketch.
*/
export const createSketch = async (data: SketchInsert) => {
    const createdSketchs = await db
        .insert(tables.sketchs)
        .values(data)
        .returning();
    const createdSketch = createdSketchs[0];
    if (!createdSketch) {
        throw new InternError('Could not retreive inserted sketch');
    }
    return createdSketch;
};

/**
Updates a sketch with the given ID.
*/
export const updateSketchById = async (
    sketchId: number,
    data: SketchUpdate
) => {
    const updatedSketchs = await db
        .update(tables.sketchs)
        .set(data)
        .where(eq(tables.sketchs.id, sketchId))
        .returning();
    const updatedSketch = updatedSketchs[0];
    if (!updatedSketch) {
        throw new InternError('Could not retreive updated sketch');
    }
    return updatedSketch;
};

/**
Deletes a sketch with the given ID.
*/
export const deleteSketchById = (sketchId: number) =>
    db.delete(tables.sketchs).where(eq(tables.sketchs.id, sketchId));

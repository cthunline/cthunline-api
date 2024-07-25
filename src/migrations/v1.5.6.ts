import { eq } from 'drizzle-orm';

import type { Sketch as SketchData } from '../controllers/schemas/definitions.js';
import { db, tables } from '../services/db.js';
import { log } from '../services/log.js';

type SketchDataToBeMigrated = Omit<SketchData, 'paths'> & {
    paths: SketchData['paths'] | string[];
};

const migrateSketchData = (
    oldSketch: SketchDataToBeMigrated
): SketchData | null => {
    let atLeastOneChange = false;
    const paths: SketchData['paths'] = [];
    for (const oldPath of oldSketch.paths) {
        if (typeof oldPath === 'string') {
            atLeastOneChange = true;
            paths.push({
                d: oldPath,
                color: 'white',
                width: 4
            });
        } else {
            paths.push(oldPath);
        }
    }
    if (!atLeastOneChange) {
        return null;
    }
    return {
        ...oldSketch,
        paths
    };
};

const migrateSessionSketchs = async () => {
    const sessions = await db.select().from(tables.sessions);
    const updateData: { id: number; sketch: SketchData }[] = [];
    for (const { id, sketch } of sessions) {
        const oldSketch = { ...sketch } as SketchDataToBeMigrated;
        const newSketch = migrateSketchData(oldSketch);
        if (newSketch) {
            updateData.push({
                id,
                sketch: newSketch
            });
        }
    }
    if (updateData.length) {
        await db.transaction(async (tx) => {
            for (const { id, sketch } of updateData) {
                await tx
                    .update(tables.sessions)
                    .set({ sketch })
                    .where(eq(tables.sessions.id, id));
            }
        });
        log.warn(
            `Migrated ${updateData.length} session sketchs (new drawing path format)`
        );
    }
};

const migrateUserSavedSketchs = async () => {
    const sketchs = await db.select().from(tables.sketchs);
    const updateData: { id: number; data: SketchData }[] = [];
    for (const { id, data } of sketchs) {
        const oldData = { ...data } as SketchDataToBeMigrated;
        const newData = migrateSketchData(oldData);
        if (newData) {
            updateData.push({
                id,
                data: newData
            });
        }
    }
    if (updateData.length) {
        await db.transaction(async (tx) => {
            for (const { id, data } of updateData) {
                await tx
                    .update(tables.sketchs)
                    .set({ data })
                    .where(eq(tables.sketchs.id, id));
            }
        });
        log.warn(
            `Migrated ${updateData.length} user saved sketchs (new drawing path format)`
        );
    }
};

// new drawing path format
export const v156 = async () => {
    await migrateSessionSketchs();
    await migrateUserSavedSketchs();
};

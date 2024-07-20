import { eq } from 'drizzle-orm';

import type { Sketch as SketchData } from '../controllers/schemas/definitions.js';
import { db, tables } from '../services/db.js';
import { log } from '../services/log.js';

// new width property in sketch drawing paths
export const v180 = async () => {
    const defaultWidth = 4;
    const sessions = await db.select().from(tables.sessions);
    const sessionUpdates: { id: number; sketch: SketchData }[] = [];
    for (const { id, sketch } of sessions) {
        let updated = false;
        for (let i = 0; i < sketch.paths.length; i += 1) {
            if (!sketch.paths[i].width) {
                sketch.paths[i].width = defaultWidth;
                updated ||= true;
            }
        }
        if (updated) {
            sessionUpdates.push({ id, sketch });
        }
    }
    if (sessionUpdates.length) {
        await db.transaction(async (tx) => {
            for (const { id, sketch } of sessionUpdates) {
                // eslint-disable-next-line no-await-in-loop
                await tx
                    .update(tables.sessions)
                    .set({ sketch })
                    .where(eq(tables.sessions.id, id));
            }
        });
        log.warn(
            `Migrated ${sessionUpdates.length} sessions drawings to have default width`
        );
    }
    const sketchs = await db.select().from(tables.sketchs);
    const sketchUpdates: { id: number; data: SketchData }[] = [];
    for (const { id, data } of sketchs) {
        let updated = false;
        for (let i = 0; i < data.paths.length; i += 1) {
            if (!data.paths[i].width) {
                data.paths[i].width = defaultWidth;
                updated ||= true;
            }
        }
        if (updated) {
            sketchUpdates.push({ id, data });
        }
    }
    if (sketchUpdates.length) {
        await db.transaction(async (tx) => {
            for (const { id, data } of sketchUpdates) {
                // eslint-disable-next-line no-await-in-loop
                await tx
                    .update(tables.sketchs)
                    .set({ data })
                    .where(eq(tables.sketchs.id, id));
            }
        });
        log.warn(
            `Migrated ${sketchUpdates.length} sketchs drawings to have default width`
        );
    }
};

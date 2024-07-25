import { eq } from 'drizzle-orm';

import type { Sketch as SketchData } from '../controllers/schemas/definitions.js';
import { db, tables } from '../services/db.js';
import { log } from '../services/log.js';

// new text items in sketch data
export const v1100 = async () => {
    const sessions = await db.select().from(tables.sessions);
    const sessionUpdates: { id: number; sketch: SketchData }[] = [];
    for (const { id, sketch } of sessions) {
        if (!sketch.texts) {
            sketch.texts = [];
            sessionUpdates.push({ id, sketch });
        }
    }
    if (sessionUpdates.length) {
        await db.transaction(async (tx) => {
            for (const { id, sketch } of sessionUpdates) {
                await tx
                    .update(tables.sessions)
                    .set({ sketch })
                    .where(eq(tables.sessions.id, id));
            }
        });
        log.warn(
            `Migrated ${sessionUpdates.length} session sketchs to have empty text items array`
        );
    }
    const sketchs = await db.select().from(tables.sketchs);
    const sketchUpdates: { id: number; data: SketchData }[] = [];
    for (const { id, data } of sketchs) {
        if (!data.texts) {
            data.texts = [];
            sketchUpdates.push({ id, data });
        }
    }
    if (sketchUpdates.length) {
        await db.transaction(async (tx) => {
            for (const { id, data } of sketchUpdates) {
                await tx
                    .update(tables.sketchs)
                    .set({ data })
                    .where(eq(tables.sketchs.id, id));
            }
        });
        log.warn(
            `Migrated ${sketchUpdates.length} saved sketchs to have empty text items array`
        );
    }
};

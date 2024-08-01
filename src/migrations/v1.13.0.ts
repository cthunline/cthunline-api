import { eq } from 'drizzle-orm';

import type { Sketch as SketchData } from '../controllers/schemas/definitions.js';
import { db, tables } from '../services/db.js';
import { log } from '../services/log.js';
import { generateToken } from '../services/tools.js';

// added id in sketch drawing paths
export const v1130 = async () => {
    const sessions = await db.select().from(tables.sessions);
    const sessionUpdates: { id: number; sketch: SketchData }[] = [];
    for (const { id, sketch } of sessions) {
        let updated = false;
        for (let i = 0; i < sketch.paths.length; i += 1) {
            if (!sketch.paths[i].id) {
                sketch.paths[i].id = generateToken(16);
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
                await tx
                    .update(tables.sessions)
                    .set({ sketch })
                    .where(eq(tables.sessions.id, id));
            }
        });
        log.warn(
            `Migrated ${sessionUpdates.length} sessions drawings to have a random ID`
        );
    }
    const sketchs = await db.select().from(tables.sketchs);
    const sketchUpdates: { id: number; data: SketchData }[] = [];
    for (const { id, data } of sketchs) {
        let updated = false;
        for (let i = 0; i < data.paths.length; i += 1) {
            if (!data.paths[i].id) {
                data.paths[i].id = generateToken(16);
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
                await tx
                    .update(tables.sketchs)
                    .set({ data })
                    .where(eq(tables.sketchs.id, id));
            }
        });
        log.warn(
            `Migrated ${sketchUpdates.length} sketchs drawings to have a random ID`
        );
    }
};

import type { AlienCharacter } from '@cthunline/games';
import { eq } from 'drizzle-orm';

import { db, tables } from '../services/db.js';
import { log } from '../services/log.js';

// migrate alien characters
export const v1230 = async () => {
    const characters = await db
        .select()
        .from(tables.characters)
        .where(eq(tables.characters.gameId, 'alien'));
    const characterUpdates: { id: number; data: AlienCharacter }[] = [];
    for (const { id, data } of characters) {
        let hasBeenUpdated = false;
        const updatedData: AlienCharacter = { ...(data as AlienCharacter) };
        if (typeof updatedData.status.maxHealth !== 'number') {
            hasBeenUpdated = true;
            updatedData.status.maxHealth = 0;
        }
        for (let i = 0; i < updatedData.talents.length; i++) {
            const talent = updatedData.talents[i];
            if (typeof talent === 'string') {
                hasBeenUpdated = true;
                updatedData.talents[i] = {
                    name: talent,
                    description: ''
                };
            }
        }
        if (hasBeenUpdated) {
            characterUpdates.push({ id, data: updatedData });
        }
    }
    if (characterUpdates.length) {
        await db.transaction(async (tx) => {
            for (const { id, data } of characterUpdates) {
                await tx
                    .update(tables.characters)
                    .set({ data })
                    .where(eq(tables.characters.id, id));
            }
        });
        log.warn(`Migrated ${characterUpdates.length} Alien characters`);
    }
};

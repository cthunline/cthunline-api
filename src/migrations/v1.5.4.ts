import { eq } from 'drizzle-orm';
import { type WarhammerFantasyCharacter } from '@cthunline/games';

import { type GameId } from '../services/games.js';
import { db, tables } from '../services/db.js';
import { log } from '../services/log.js';

const warhammerFantasyGameId: GameId = 'warhammerFantasy';

// new warhammer encumbrance bonux max field
export const v154 = async () => {
    const warhammerCharacters = await db
        .select()
        .from(tables.characters)
        .where(eq(tables.characters.gameId, warhammerFantasyGameId));
    const updateData: { id: number; data: WarhammerFantasyCharacter }[] = [];
    warhammerCharacters.forEach(({ id, data }) => {
        const warhammerCharData = { ...data } as WarhammerFantasyCharacter;
        if (!Object.hasOwn(warhammerCharData.encumbrance, 'maximumBonus')) {
            warhammerCharData.encumbrance.maximumBonus = 0;
            updateData.push({ id, data: warhammerCharData });
        }
    });
    if (updateData.length) {
        await db.transaction(async (tx) => {
            for (const { id, data } of updateData) {
                // eslint-disable-next-line no-await-in-loop
                await tx
                    .update(tables.characters)
                    .set({ data })
                    .where(eq(tables.characters.id, id));
            }
        });
        log.warn(
            `Migrated ${updateData.length} Warhammer Fantasy characters (encumbrance maximum bonus field)`
        );
    }
};

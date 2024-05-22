import { sql } from 'drizzle-orm';
import path from 'path';
import fs from 'fs';

import { warhammerFantasyCharacters } from '../data/characters/warhammerFantasyCharacters.data.js';
import { apocalypseWorldCharacters } from '../data/characters/apocalypseWorldCharacters.data.js';
import { seventhSeaCharacters } from '../data/characters/seventhSeaCharacters.data.js';
import { swd6Characters } from '../data/characters/swd6Characters.data.js';
import { dnd5Characters } from '../data/characters/dnd5Characters.data.js';
import { cocCharacters } from '../data/characters/cocCharacters.data.js';
import { importMetaUrlDirname } from '../../../src/services/tools.js';
import { assetDir } from '../../../src/controllers/helpers/asset.js';
import { directories } from '../data/directories.data.js';
import { db, tables } from '../../../src/services/db.js';
import { cache } from '../../../src/services/cache.js';
import { sessions } from '../data/sessions.data.js';
import { sketchs } from '../data/sketchs.data.js';
import { assets } from '../data/assets.data.js';
import { notes } from '../data/notes.data.js';
import { users } from '../data/users.data.js';

export const usersData = users;
export const sessionsData = sessions;
export const sketchsData = sketchs;
export const notesData = notes;
export const assetsData = assets;
export const directoriesData = directories;
export const charactersData = [
    ...apocalypseWorldCharacters,
    ...cocCharacters,
    ...swd6Characters,
    ...dnd5Characters,
    ...seventhSeaCharacters,
    ...warhammerFantasyCharacters
];

const dirname = importMetaUrlDirname(import.meta.url);

export const copyAssetFiles = async () => {
    await Promise.all(
        [...new Set(assets.map(({ userId }) => userId))].map((userId) =>
            (async () => {
                const userDir = path.join(assetDir, userId.toString());
                try {
                    await fs.promises.access(userDir, fs.constants.F_OK);
                } catch {
                    await fs.promises.mkdir(userDir);
                }
            })()
        )
    );
    await Promise.all(
        assets.map(({ name, path: assetPath }) =>
            fs.promises.copyFile(
                path.join(dirname, '../data/assets', name),
                path.join(assetDir, assetPath)
            )
        )
    );
};

export const deleteAssetFiles = async () => {
    const dbAssets = await db.select().from(tables.assets);
    await Promise.all(
        dbAssets.map(({ path: assetPath }) =>
            (async () => {
                try {
                    const filePath = path.join(assetDir, assetPath);
                    await fs.promises.access(filePath, fs.constants.F_OK);
                    await fs.promises.rm(filePath);
                } catch {
                    //
                }
            })()
        )
    );
    const characters = await db.select().from(tables.characters);
    await Promise.all(
        characters.map(({ portrait }) =>
            (async () => {
                try {
                    if (portrait) {
                        const filePath = path.join(assetDir, portrait);
                        await fs.promises.access(filePath, fs.constants.F_OK);
                        await fs.promises.rm(filePath);
                    }
                } catch {
                    //
                }
            })()
        )
    );
};

export const getAssetBuffer = async (assetName: string) => {
    const localPath = path.join(dirname, '../data/assets', assetName);
    return fs.promises.readFile(localPath);
};

export const deleteAllData = async () => {
    await deleteAssetFiles();
    for (const table of Object.keys(tables)) {
        const query = `TRUNCATE ${table} RESTART IDENTITY CASCADE;`;
        await db.execute(sql.raw(query));
    }
};

const resetAutoIncrement = async () => {
    for (const table of Object.keys(tables)) {
        const query = `SELECT SETVAL(pg_get_serial_sequence('${table}', 'id'), (SELECT MAX(id) FROM ${table}));`;
        await db.execute(sql.raw(query));
    }
};

export const insertAllData = async () => {
    await db.insert(tables.users).values(usersData);
    // must not be inserted simultaneously because of relation id constraint
    for (const data of directoriesData) {
        await db.insert(tables.directories).values(data);
    }
    await Promise.all([
        db.insert(tables.assets).values(assetsData),
        copyAssetFiles()
    ]);
    await db.insert(tables.sessions).values(sessionsData);
    await db.insert(tables.sketchs).values(sketchsData);
    await db.insert(tables.notes).values(notesData);
    await db.insert(tables.characters).values(charactersData);
    await resetAutoIncrement();
};

export const resetData = async (insertData: boolean = true) => {
    await deleteAllData();
    if (insertData) {
        await insertAllData();
    }
};

export const resetCache = async () => {
    await cache.flushall();
};

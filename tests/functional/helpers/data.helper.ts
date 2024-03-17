import Fs from 'fs';
import Path from 'path';

import { assetDir } from '../../../src/controllers/helpers/asset.js';
import { prisma } from '../../../src/services/prisma.js';

import warhammerFantasyCharacters from '../data/characters/warhammerFantasyCharacters.json';
import seventhSeaCharacters from '../data/characters/seventhSeaCharacters.json';
import { importMetaUrlDirname } from '../../../src/services/tools.js';
import swd6Characters from '../data/characters/swd6Characters.json';
import dnd5Characters from '../data/characters/dnd5Characters.json';
import cocCharacters from '../data/characters/cocCharacters.json';
import directories from '../data/directories.json';
import sessions from '../data/sessions.json';
import sketchs from '../data/sketchs.json';
import assets from '../data/assets.json';
import notes from '../data/notes.json';
import users from '../data/users.json';

export const usersData = users;
export const sessionsData = sessions;
export const sketchsData = sketchs;
export const notesData = notes;
export const assetsData = assets;
export const directoriesData = directories;
export const charactersData = [
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
                const userDir = Path.join(assetDir, userId.toString());
                try {
                    await Fs.promises.access(userDir, Fs.constants.F_OK);
                } catch {
                    await Fs.promises.mkdir(userDir);
                }
            })()
        )
    );
    await Promise.all(
        assets.map(({ name, path }) =>
            Fs.promises.copyFile(
                Path.join(dirname, '../data/assets', name),
                Path.join(assetDir, path)
            )
        )
    );
};

export const deleteAssetFiles = async () => {
    const dbAssets = await prisma.asset.findMany();
    await Promise.all(
        dbAssets.map(({ path }) =>
            (async () => {
                try {
                    const filePath = Path.join(assetDir, path);
                    await Fs.promises.access(filePath, Fs.constants.F_OK);
                    await Fs.promises.rm(filePath);
                } catch {
                    //
                }
            })()
        )
    );
    const characters = await prisma.character.findMany();
    await Promise.all(
        characters.map(({ portrait }) =>
            (async () => {
                try {
                    if (portrait) {
                        const filePath = Path.join(assetDir, portrait);
                        await Fs.promises.access(filePath, Fs.constants.F_OK);
                        await Fs.promises.rm(filePath);
                    }
                } catch {
                    //
                }
            })()
        )
    );
};

export const getAssetBuffer = async (assetName: string) => {
    const localPath = Path.join(dirname, '../data/assets', assetName);
    return Fs.promises.readFile(localPath);
};

export const deleteAllData = async () => {
    await deleteAssetFiles();
    await prisma.character.deleteMany();
    await prisma.note.deleteMany();
    await prisma.session.deleteMany();
    await prisma.sketch.deleteMany();
    await prisma.asset.deleteMany();
    await prisma.directory.deleteMany();
    await prisma.user.deleteMany();
};

export const insertAllData = async () => {
    await prisma.user.createMany({ data: usersData });
    // must not be inserted simultaneously because of relation id constraint
    for (const data of directoriesData) {
        await prisma.directory.create({ data });
    }
    await Promise.all([
        prisma.asset.createMany({ data: assetsData }),
        copyAssetFiles()
    ]);
    await prisma.session.createMany({ data: sessionsData });
    await prisma.sketch.createMany({ data: sketchsData });
    await prisma.note.createMany({ data: notesData });
    await prisma.character.createMany({ data: charactersData });
};

export const resetData = async (insertData: boolean = true) => {
    await deleteAllData();
    if (insertData) {
        await insertAllData();
    }
};

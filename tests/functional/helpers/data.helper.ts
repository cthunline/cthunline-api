import Fs from 'fs';
import Path from 'path';

import { Prisma } from '../../../src/services/prisma';
import { assetDir } from '../../../src/controllers/helpers/asset';

import users from '../data/users.json';
import sessions from '../data/sessions.json';
import sketchs from '../data/sketchs.json';
import assets from '../data/assets.json';
import directories from '../data/directories.json';
import notes from '../data/notes.json';
import cocCharacters from '../data/characters/cocCharacters.json';
import swd6Characters from '../data/characters/swd6Characters.json';
import dnd5Characters from '../data/characters/dnd5Characters.json';
import seventhSeaCharacters from '../data/characters/seventhSeaCharacters.json';
import warhammerFantasyCharacters from '../data/characters/warhammerFantasyCharacters.json';

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

const Data = {
    async reset(insertData: boolean = true) {
        await Data.deleteAll();
        if (insertData) {
            await Data.insertAll();
        }
    },

    async deleteAll() {
        await Data.deleteAssetFiles();
        await Prisma.character.deleteMany();
        await Prisma.note.deleteMany();
        await Prisma.session.deleteMany();
        await Prisma.sketch.deleteMany();
        await Prisma.asset.deleteMany();
        await Prisma.directory.deleteMany();
        await Prisma.user.deleteMany();
    },

    async insertAll() {
        await Prisma.user.createMany({ data: usersData });
        // must not be inserted simultaneously because of relation id constraint
        for (const data of directoriesData) {
            await Prisma.directory.create({ data });
        }
        await Promise.all([
            Prisma.asset.createMany({ data: assetsData }),
            Data.copyAssetFiles()
        ]);
        await Prisma.session.createMany({ data: sessionsData });
        await Prisma.sketch.createMany({ data: sketchsData });
        await Prisma.note.createMany({ data: notesData });
        await Prisma.character.createMany({ data: charactersData });
    },

    async copyAssetFiles() {
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
                    Path.join(__dirname, '../data/assets', name),
                    Path.join(assetDir, path)
                )
            )
        );
    },

    async deleteAssetFiles() {
        const dbAssets = await Prisma.asset.findMany();
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
        const characters = await Prisma.character.findMany();
        await Promise.all(
            characters.map(({ portrait }) =>
                (async () => {
                    try {
                        if (portrait) {
                            const filePath = Path.join(assetDir, portrait);
                            await Fs.promises.access(
                                filePath,
                                Fs.constants.F_OK
                            );
                            await Fs.promises.rm(filePath);
                        }
                    } catch {
                        //
                    }
                })()
            )
        );
    },

    async getAssetBuffer(assetName: string) {
        const localPath = Path.join(__dirname, '../data/assets', assetName);
        return Fs.promises.readFile(localPath);
    }
};

export default Data;

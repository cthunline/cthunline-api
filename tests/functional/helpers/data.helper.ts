import Fs from 'fs';
import Path from 'path';

import { Prisma } from '../../../src/services/prisma';
import { assetDir } from '../../../src/services/controllerServices/asset';
import users from '../data/users.json';
import sessions from '../data/sessions.json';
import assets from '../data/assets.json';
import directories from '../data/directories.json';
import notes from '../data/notes.json';
import cocCharacters from '../data/characters/cocCharacters.json';
import swd6Characters from '../data/characters/swd6Characters.json';

export const usersData = users;
export const sessionsData = sessions;
export const notesData = notes;
export const assetsData = assets;
export const directoriesData = directories;
export const charactersData = [
    ...cocCharacters,
    ...swd6Characters
];

const Data = {
    async reset(insertData: boolean = true) {
        await Data.deleteAll();
        if (insertData) {
            await Data.insertAll();
        }
    },

    async deleteAll() {
        await Prisma.character.deleteMany();
        await Prisma.note.deleteMany();
        await Prisma.session.deleteMany();
        await Data.deleteAssetFiles();
        await Prisma.asset.deleteMany();
        await Prisma.directory.deleteMany();
        await Prisma.user.deleteMany();
    },

    async insertAll() {
        await Promise.all(usersData.map((data) => (
            Prisma.user.create({ data })
        )));
        // must not be inserted simultaneously because of relation id constraint
        for (const data of directoriesData) {
            await Prisma.directory.create({ data });
        }
        await Promise.all([
            ...assetsData.map((data) => (
                Prisma.asset.create({ data })
            )),
            Data.copyAssetFiles()
        ]);
        await Promise.all(sessionsData.map((data) => (
            Prisma.session.create({ data })
        )));
        await Promise.all(notesData.map((data) => (
            Prisma.note.create({ data })
        )));
        await Promise.all(charactersData.map((data) => (
            Prisma.character.create({ data })
        )));
    },

    async copyAssetFiles() {
        await Promise.all(
            [...new Set(
                assets.map(({ userId }) => userId)
            )].map((userId) => (
                (async () => {
                    const userDir = Path.join(assetDir, userId.toString());
                    try {
                        await Fs.promises.access(userDir, Fs.constants.F_OK);
                    } catch {
                        await Fs.promises.mkdir(userDir);
                    }
                })()
            ))
        );
        await Promise.all(
            assets.map(({ name, path }) => (
                Fs.promises.copyFile(
                    Path.join(__dirname, '../data/assets', name),
                    Path.join(assetDir, path)
                )
            ))
        );
    },

    async deleteAssetFiles() {
        const dbAssets = await Prisma.asset.findMany();
        await Promise.all(
            dbAssets.map(({ path }) => (
                (async () => {
                    try {
                        const filePath = Path.join(assetDir, path);
                        await Fs.promises.access(filePath, Fs.constants.F_OK);
                        await Fs.promises.rm(filePath);
                    } catch {
                        //
                    }
                })()
            ))
        );
    }
};

export default Data;

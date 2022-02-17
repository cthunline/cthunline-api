import Fs from 'fs';
import Path from 'path';

import { Prisma } from '../../src/services/prisma';
import users from '../data/users.json';
import sessions from '../data/sessions.json';
import characters from '../data/characters.json';
import assets from '../data/assets.json';
import { assetDir } from '../../src/controllers/asset';

const Data = {
    async reset() {
        await Data.deleteAll();
        await Data.insertAll();
    },

    async deleteAll() {
        await Prisma.token.deleteMany();
        await Prisma.character.deleteMany();
        await Prisma.session.deleteMany();
        await Data.deleteAssetFiles();
        await Prisma.asset.deleteMany();
        await Prisma.user.deleteMany();
    },

    async insertAll() {
        await Promise.all(users.map((data) => (
            Prisma.user.create({ data })
        )));
        await Promise.all([
            ...assets.map((data) => (
                Prisma.asset.create({ data })
            )),
            Data.copyAssetFiles()
        ]);
        await Promise.all(sessions.map((data) => (
            Prisma.session.create({ data })
        )));
        await Promise.all(characters.map((data) => (
            Prisma.character.create({ data })
        )));
    },

    async copyAssetFiles() {
        await Promise.all(
            [...new Set(
                assets.map(({ userId }) => userId)
            )].map((userId) => (
                (async () => {
                    const userDir = Path.join(assetDir, userId);
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

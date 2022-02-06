import { Prisma } from '../../src/services/prisma';
import users from '../data/users.json';
import sessions from '../data/sessions.json';
import characters from '../data/characters.json';

const Data = {
    reset: async () => {
        await Data.truncateAll();
        await Data.insertAll();
    },

    truncateAll: async () => {
        await Prisma.token.deleteMany();
        await Prisma.character.deleteMany();
        await Prisma.session.deleteMany();
        await Prisma.user.deleteMany();
    },

    insertAll: async () => {
        await Promise.all(users.map((data) => (
            Prisma.user.create({ data })
        )));
        await Promise.all(sessions.map((data) => (
            Prisma.session.create({ data })
        )));
        await Promise.all(characters.map((data) => (
            Prisma.character.create({ data })
        )));
    }
};

export default Data;

import { Prisma } from '../../src/services/prisma';
import users from '../data/users.json';
import sessions from '../data/sessions.json';

const Data = {
    reset: async () => {
        await Data.truncateAll();
        await Data.insertAll();
    },

    truncateAll: async () => {
        await Prisma.token.deleteMany();
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
    }
};

export default Data;

import { Prisma } from '../../src/services/prisma';
import users from '../data/users.json';

const Data = {
    reset: async () => {
        await Data.truncateAll();
        await Data.insertAll();
    },

    truncateAll: async () => {
        await Prisma.token.deleteMany();
        await Prisma.user.deleteMany();
    },

    insertAll: async () => {
        await Promise.all(users.map((data) => (
            Prisma.user.create({ data })
        )));
    }
};

export default Data;

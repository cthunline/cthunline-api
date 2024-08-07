import type { DirectoryInsert } from '../../../src/drizzle/schema.js';

export const directories: (DirectoryInsert & { id: number })[] = [
    {
        id: 1,
        name: 'Directory 1',
        userId: 3
    },
    {
        id: 2,
        name: 'Directory 2',
        userId: 3
    },
    {
        id: 3,
        name: 'Directory 1-1',
        userId: 3,
        parentId: 1
    },
    {
        id: 4,
        name: 'Directory 1-2',
        userId: 3,
        parentId: 1
    },
    {
        id: 5,
        name: 'Directory 2-1',
        userId: 3,
        parentId: 2
    },
    {
        id: 6,
        name: 'Directory 1-1-1',
        userId: 3,
        parentId: 3
    },
    {
        id: 7,
        name: 'Directory 1-1-2',
        userId: 3,
        parentId: 3
    },
    {
        id: 8,
        name: 'Some directory',
        userId: 2
    }
];

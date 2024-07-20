import type { AssetInsert } from '../../../src/drizzle/schema.js';

export const assets: (AssetInsert & { id: number })[] = [
    {
        id: 1,
        type: 'image',
        name: 'asset.png',
        path: '3/cc1561f53762a6790b306d21',
        directoryId: null,
        userId: 3
    },
    {
        id: 2,
        type: 'image',
        name: 'asset.jpg',
        path: '3/cc1561f53762a6790b306d22',
        directoryId: null,
        userId: 3
    },
    {
        id: 3,
        type: 'audio',
        name: 'asset.mp3',
        path: '3/cc1561f53762a6790b306d23',
        directoryId: null,
        userId: 3
    },
    {
        id: 4,
        type: 'audio',
        name: 'asset.mp3',
        path: '3/cc1561f53762a6790b306d24',
        directoryId: 1,
        userId: 3
    },
    {
        id: 5,
        type: 'audio',
        name: 'asset.mp3',
        path: '3/cc1561f53762a6790b306d25',
        directoryId: 3,
        userId: 3
    },
    {
        id: 6,
        type: 'audio',
        name: 'asset.mp3',
        path: '3/cc1561f53762a6790b306d26',
        directoryId: 6,
        userId: 3
    },
    {
        id: 7,
        type: 'audio',
        name: 'asset.mp3',
        path: '2/cc1561f53762a6790b306999',
        directoryId: 8,
        userId: 2
    }
];

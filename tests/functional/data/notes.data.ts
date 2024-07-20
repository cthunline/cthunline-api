import type { NoteInsert } from '../../../src/drizzle/schema.js';

export const notes: (NoteInsert & { id: number })[] = [
    {
        id: 1,
        sessionId: 1,
        userId: 1,
        position: 1,
        isShared: true,
        title: 'A Lorem ipsum dolor sit amet',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla id orci sit amet nulla dictum mollis. Maecenas ornare libero a ante vulputate laoreet.'
    },
    {
        id: 2,
        sessionId: 1,
        userId: 1,
        position: 2,
        isShared: false,
        title: 'B Lorem dolor sit amet ipsum ',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla id orci sit amet nulla dictum mollis. Maecenas ornare libero a ante vulputate laoreet.'
    },
    {
        id: 3,
        sessionId: 1,
        userId: 1,
        position: 3,
        isShared: false,
        title: 'C Lorem dolor sit amet ipsum',
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla id orci sit amet nulla dictum mollis. Maecenas ornare libero a ante vulputate laoreet.'
    },
    {
        id: 4,
        sessionId: 1,
        userId: 2,
        position: 1,
        isShared: false,
        title: 'A Aliquam nunc rhoncus',
        text: 'Aliquam rhoncus nunc in iaculis luctus. Etiam interdum, mi ac commodo semper, nisi nisl varius purus, at pharetra quam lacus sit amet neque. Suspendisse lacinia, ligula sed pellentesque bibendum'
    },
    {
        id: 5,
        sessionId: 1,
        userId: 2,
        position: 2,
        isShared: true,
        title: 'B Aliquam rhoncus nunc',
        text: 'Aliquam rhoncus nunc in iaculis luctus. Etiam interdum, mi ac commodo semper, nisi nisl varius purus, at pharetra quam lacus sit amet neque. Suspendisse lacinia, ligula sed pellentesque bibendum'
    },
    {
        id: 6,
        sessionId: 1,
        userId: 2,
        position: 3,
        isShared: false,
        title: 'C Nunc aliquam rhoncus',
        text: 'Aliquam rhoncus nunc in iaculis luctus. Etiam interdum, mi ac commodo semper, nisi nisl varius purus, at pharetra quam lacus sit amet neque. Suspendisse lacinia, ligula sed pellentesque bibendum'
    },
    {
        id: 7,
        sessionId: 1,
        userId: 3,
        position: 1,
        isShared: false,
        title: 'A Nulla risus ex fermentum',
        text: 'Nulla risus ex, fermentum non cursus rutrum, tempor in mi. Etiam a tellus in sapien euismod iaculis vitae sed tellus. Quisque magna ipsum, finibus ac velit ut, suscipit porta tortor'
    },
    {
        id: 8,
        sessionId: 1,
        userId: 3,
        position: 2,
        isShared: true,
        title: 'B Nulla risus fermentum ex',
        text: 'Nulla risus ex, fermentum non cursus rutrum, tempor in mi. Etiam a tellus in sapien euismod iaculis vitae sed tellus. Quisque magna ipsum, finibus ac velit ut, suscipit porta tortor'
    },
    {
        id: 9,
        sessionId: 1,
        userId: 3,
        position: 3,
        isShared: false,
        title: 'C Nulla fermentum risus ex',
        text: 'Nulla risus ex, fermentum non cursus rutrum, tempor in mi. Etiam a tellus in sapien euismod iaculis vitae sed tellus. Quisque magna ipsum, finibus ac velit ut, suscipit porta tortor'
    },
    {
        id: 10,
        sessionId: 1,
        userId: 3,
        position: 4,
        isShared: true,
        title: 'D Risus ex fermentum nulla',
        text: 'Nulla risus ex, fermentum non cursus rutrum, tempor in mi. Etiam a tellus in sapien euismod iaculis vitae sed tellus. Quisque magna ipsum, finibus ac velit ut, suscipit porta tortor'
    },
    {
        id: 11,
        sessionId: 1,
        userId: 4,
        position: 1,
        isShared: false,
        title: 'A In condimentum pellentesque facilisis',
        text: 'In condimentum facilisis pellentesque. Curabitur a massa molestie, dictum nibh lacinia, consectetur urna. Sed sed dapibus eros. Nullam eget mauris id erat sollicitudin venenatis'
    },
    {
        id: 12,
        sessionId: 1,
        userId: 4,
        position: 2,
        isShared: false,
        title: 'B In facilisis condimentum pellentesque',
        text: 'In condimentum facilisis pellentesque. Curabitur a massa molestie, dictum nibh lacinia, consectetur urna. Sed sed dapibus eros. Nullam eget mauris id erat sollicitudin venenatis'
    },
    {
        id: 13,
        sessionId: 1,
        userId: 4,
        position: 3,
        isShared: true,
        title: 'C In condimentum facilisis pellentesque',
        text: 'In condimentum facilisis pellentesque. Curabitur a massa molestie, dictum nibh lacinia, consectetur urna. Sed sed dapibus eros. Nullam eget mauris id erat sollicitudin venenatis'
    }
];

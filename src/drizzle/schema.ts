import { type Character as CharacterData } from '@cthunline/games';
import {
    text,
    json,
    serial,
    integer,
    pgTable,
    varchar,
    boolean,
    timestamp,
    uniqueIndex,
    type AnyPgColumn
} from 'drizzle-orm/pg-core';

import { type Sketch as SketchData } from '../controllers/schemas/definitions.js';

export const users = pgTable(
    'users',
    {
        id: serial('id').primaryKey(),
        name: varchar('name', { length: 256 }).notNull(),
        email: varchar('email', { length: 256 }).notNull(),
        password: varchar('password', { length: 256 }).notNull(),
        theme: varchar('theme', { length: 32 }).notNull(),
        locale: varchar('locale', { length: 8 }).notNull(),
        isAdmin: boolean('is_admin').notNull(),
        isEnabled: boolean('is_enabled').notNull(),
        createdAt: timestamp('created_at', { mode: 'date' })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { mode: 'date' })
            .defaultNow()
            .notNull()
    },
    ({ email }) => ({
        emailIndex: uniqueIndex('email_index').on(email)
    })
);

export type User = typeof users.$inferSelect;
export type SafeUser = Omit<User, 'password'>;
export type UserInsert = typeof users.$inferInsert;
export type UserUpdate = Partial<UserInsert>;

export const characters = pgTable('characters', {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
        .references(() => users.id)
        .notNull(),
    gameId: varchar('game_id', { length: 32 }).notNull(),
    name: varchar('name', { length: 256 }).notNull(),
    portrait: varchar('portrait', { length: 256 }),
    data: json('data').$type<CharacterData>().notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull()
});

export type Character = typeof characters.$inferSelect;
export type CharacterInsert = typeof characters.$inferInsert;
export type CharacterUpdate = Partial<CharacterInsert>;

export const sessions = pgTable('sessions', {
    id: serial('id').primaryKey(),
    masterId: integer('master_id')
        .references(() => users.id)
        .notNull(),
    gameId: varchar('gameId', { length: 32 }).notNull(),
    name: varchar('name', { length: 256 }).notNull(),
    sketch: json('data').$type<SketchData>().notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull()
});

export type Session = typeof sessions.$inferSelect;
export type SessionInsert = typeof sessions.$inferInsert;
export type SessionUpdate = Partial<SessionInsert>;

export const sketchs = pgTable('sketchs', {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
        .references(() => users.id)
        .notNull(),
    name: varchar('name', { length: 256 }).notNull(),
    data: json('data').$type<SketchData>().notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull()
});

export type Sketch = typeof sketchs.$inferSelect;
export type SketchInsert = typeof sketchs.$inferInsert;
export type SketchUpdate = Partial<SketchInsert>;

export const directories = pgTable('directories', {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
        .references(() => users.id)
        .notNull(),
    parentId: integer('parent_id').references(
        (): AnyPgColumn => directories.id,
        {
            onUpdate: 'no action',
            onDelete: 'cascade'
        }
    ),
    name: varchar('name', { length: 256 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull()
});

export type Directory = typeof directories.$inferSelect;
export type DirectoryInsert = typeof directories.$inferInsert;
export type DirectoryUpdate = Partial<DirectoryInsert>;

export const assets = pgTable('assets', {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
        .references(() => users.id)
        .notNull(),
    directoryId: integer('directory_id').references(() => directories.id),
    type: varchar('type', { length: 32 }).notNull(),
    name: varchar('name', { length: 256 }).notNull(),
    path: varchar('path', { length: 256 }).notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull()
});

export type Asset = typeof assets.$inferSelect;
export type AssetInsert = typeof assets.$inferInsert;
export type AssetUpdate = Partial<AssetInsert>;

export const invitations = pgTable(
    'invitations',
    {
        id: serial('id').primaryKey(),
        code: varchar('code', { length: 128 }).notNull(),
        expire: timestamp('expire', { mode: 'date' }).notNull(),
        isUsed: boolean('is_used').notNull(),
        createdAt: timestamp('created_at', { mode: 'date' })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp('updated_at', { mode: 'date' })
            .defaultNow()
            .notNull()
    },
    ({ code }) => ({
        codeIndex: uniqueIndex('code_index').on(code)
    })
);

export type Invitation = typeof invitations.$inferSelect;
export type InvitationInsert = typeof invitations.$inferInsert;
export type InvitationUpdate = Partial<InvitationInsert>;

export const notes = pgTable('notes', {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
        .references(() => users.id)
        .notNull(),
    sessionId: integer('session_id')
        .references(() => sessions.id)
        .notNull(),
    position: integer('position').notNull(),
    isShared: boolean('is_shared').notNull(),
    title: varchar('title', { length: 256 }).notNull(),
    text: text('text').notNull(),
    createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull()
});

export type Note = typeof notes.$inferSelect;
export type NoteInsert = typeof notes.$inferInsert;
export type NoteUpdate = Partial<NoteInsert>;

import path from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import pg from 'pg';

import * as schema from '../drizzle/schema.js';
import { hashPassword } from './crypto.js';
import { getEnv } from './env.js';
import { log } from './log.js';
import { importMetaUrlDirname } from './tools.js';

const dirname = importMetaUrlDirname(import.meta.url);

export const pool = new pg.Pool({
    connectionString: getEnv('DATABASE_URL')
});
await pool.connect();

export const db = drizzle(pool, {
    schema
});

export const tables = schema;

/**
Apply database migrations.
*/
export const migrateDb = async () =>
    migrate(db, {
        migrationsFolder: path.join(dirname, '../drizzle/migrations')
    });

/**
Database initialization tasks.
Creates a default user if users collection is empty.
*/
export const initDb = async () => {
    const users = await db.select().from(tables.users);
    if (!users.length) {
        const name = getEnv('DEFAULT_ADMIN_NAME');
        const email = getEnv('DEFAULT_ADMIN_EMAIL');
        const password = getEnv('DEFAULT_ADMIN_PASSWORD');
        const theme = getEnv('DEFAULT_THEME');
        const locale = getEnv('DEFAULT_LOCALE');
        if (name && email && password) {
            await db.insert(tables.users).values({
                name,
                email,
                password: await hashPassword(password),
                theme,
                locale,
                isAdmin: true,
                isEnabled: true
            });
            log.warn(
                `Default user created (email: ${email} / password: ${password})`
            );
        } else {
            log.error('Environment file is missing default admin information');
        }
    }
};

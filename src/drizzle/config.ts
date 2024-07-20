import type { Config } from 'drizzle-kit';

import 'dotenv/config';

// eslint-disable-next-line import/no-default-export
export default {
    dialect: 'postgresql',
    schema: 'src/drizzle/schema.ts',
    out: 'src/drizzle/migrations',
    dbCredentials: {
        url: process.env.DATABASE_URL ?? ''
    }
} satisfies Config;

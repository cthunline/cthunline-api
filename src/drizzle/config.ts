import { type Config } from 'drizzle-kit';

import 'dotenv/config';

// eslint-disable-next-line import/no-default-export
export default {
    schema: 'src/drizzle/schema.ts',
    out: 'src/drizzle/migrations',
    driver: 'pg',
    dbCredentials: {
        connectionString: process.env.DATABASE_URL ?? ''
    }
} satisfies Config;

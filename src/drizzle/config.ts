import type { Config } from 'drizzle-kit';

import 'dotenv/config';

// biome-ignore lint/style/noDefaultExport: required by drizzle config
export default {
    dialect: 'postgresql',
    schema: 'src/drizzle/schema.ts',
    out: 'src/drizzle/migrations',
    dbCredentials: {
        url: process.env.DATABASE_URL ?? ''
    }
} satisfies Config;

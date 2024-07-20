import type { ExtractTablesWithRelations } from 'drizzle-orm';
import type { NodePgQueryResultHKT } from 'drizzle-orm/node-postgres/session.js';
import type { PgTransaction } from 'drizzle-orm/pg-core/session.js';

import type * as schema from '../drizzle/schema.js';

export type DbSchema = typeof schema;

export type DbTransaction = PgTransaction<
    NodePgQueryResultHKT,
    DbSchema,
    ExtractTablesWithRelations<DbSchema>
>;

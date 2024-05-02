import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

import config from '#src/config.ts';
import { Database } from '#src/types/db.ts';

const { connectionString } = config.database;

export default new Kysely<Database>({
  dialect: new PostgresDialect({ pool: new Pool({ connectionString }) })
});

import knex from 'knex';

import config from '#src/config.js';
import db from '#src/constants/db.js';
import migrate from '#src/functions/migrate.js';

const { console } = globalThis;

const { name: databaseName, connectionString } = config.database;

const maybeCreateDb = async () => {
  const tempDb = knex({
    connection: connectionString.slice(0, -databaseName.length),
    client: 'pg',
    pool: { min: 0, max: 1 }
  });

  if (
    await tempDb.first().from('pg_database').where({ datname: databaseName })
  ) {
    console.log('Database exists!');
    return false;
  }

  console.log('Creating database...');

  await tempDb.raw(
    'create database ?? template "template0" encoding "UTF8" lc_collate "C" lc_ctype "C"',
    databaseName
  );

  console.log('Created database, running initial migrations...');

  await migrate();

  return true;
};

export default {
  start: async () => {
    await maybeCreateDb();
    console.log('DB Started');
  },
  stop: async () => await db.destroy()
};

import knex from 'knex';
import pg from 'pg';

import config from '#src/config.js';
import db from '#src/constants/db.js';
import createId from '#src/functions/create-id.js';
import migrate from '#src/functions/migrate.js';

const { console } = globalThis;

const { name: databaseName, connectionString } = config.database;

pg.types.setTypeParser(20, parseInt);

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

// Guard against a missing seed season (e.g. after a volume was wiped but the
// database itself still exists, so migrations don't re-run). Without a current
// season, getCurrentSeason returns nothing and roll-season crashes.
const maybeSeedSeason = async () => {
  if (await db.first().from('seasons')) return;

  console.log('No season found, seeding initial season...');

  await db
    .insert({
      id: createId(),
      season: 1,
      createdAt: new Date('2024-01-01T00:00:00Z'),
      endsAt: new Date('2025-03-01T00:00:00Z')
    })
    .into('seasons');
};

export default {
  start: async () => {
    await maybeCreateDb();
    await maybeSeedSeason();
    console.log('DB Started');
  },
  stop: async () => await db.destroy()
};

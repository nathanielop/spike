import knex from 'knex';

import config from '#src/config.js';

const { connectionString } = config.database;

export default knex({ connection: connectionString, client: 'pg' });

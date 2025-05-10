import createLoad from '#src/functions/create-load.js';
import createWork from '#src/functions/create-work.js';

export default {
  up: async tx => {
    await tx.schema.createTable('work', t => {
      t.text('id').primary();
      t.text('type').notNullable();
      t.jsonb('data');
      t.datetime('runAt');
      t.datetime('createdAt').notNullable();
    });

    await createWork({ type: 'decayElo', load: createLoad({ tx }) });
  },
  down: async tx => await tx.schema.dropTable('work')
};

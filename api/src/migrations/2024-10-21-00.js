import createId from '#src/functions/create-id.js';

export default {
  up: async tx => {
    await tx.schema.createTable('seasons', t => {
      t.integer('id').primary();
      t.datetime('createdAt').notNullable();
      t.datetime('endedAt');
    });

    await tx.insert({ id: 1, createdAt: new Date() }).into('seasons');

    await tx.schema.createTable('work', t => {
      t.text('id').primary();
      t.specificType('type', 'citext').notNullable();
      t.datetime('startAt');
      t.jsonb('data');
      t.datetime('createdAt').notNullable();
    });

    await tx
      .insert({
        id: createId(),
        type: 'cycleSeason',
        createdAt: new Date(),
        startAt: '2024-11-15T00:00:00.000Z'
      })
      .into('work');
  },

  down: async tx => await tx.schema.dropTable('work')
};

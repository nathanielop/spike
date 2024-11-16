export default {
  up: async tx =>
    await tx.schema.createTable('awards', t => {
      t.text('id').primary();
      t.specificType('name', 'citext').notNullable();
      t.text('description');
      t.text('playerId')
        .notNullable()
        .references('players.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      t.datetime('createdAt').notNullable();
    }),
  down: async tx => await tx.schema.dropTable('awards')
};

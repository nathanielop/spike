export default {
  up: async tx =>
    await tx.schema.createTable('bounties', t => {
      t.text('id').primary();
      t.text('placedByPlayerId')
        .references('players.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      t.text('placedOnPlayerId')
        .references('players.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      t.integer('amount').notNullable();
      t.boolean('isClaimed').notNullable();
      t.datetime('createdAt').notNullable();
    }),
  down: async tx => await tx.schema.dropTable('bounties')
};

export default {
  up: async tx =>
    await tx.schema.createTable('bets', t => {
      t.text('id').primary();
      t.text('playerId')
        .notNullable()
        .references('players.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      t.text('seriesTeamId')
        .notNullable()
        .references('seriesTeams.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      t.integer('amount').notNullable();
      t.decimal('payRate', 10).notNullable();
      t.integer('paidOutAmount');
      t.boolean('isActive').notNullable();
      t.datetime('createdAt').notNullable();
    }),
  down: async tx => await tx.schema.dropTable('bets')
};

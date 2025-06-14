export default {
  up: async tx => {
    await tx.schema.table('series', t => {
      t.text('modifier');
    });

    await tx.schema.createTable('pendingPlayers', t => {
      t.text('id').primary();
      t.text('playerId')
        .references('players.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      t.text('modifier');
      t.datetime('createdAt').notNullable();
    });
  },
  down: async tx => {
    await tx.schema.table('series', t => {
      t.dropColumn('modifier');
    });

    await tx.schema.dropTable('pendingPlayers');
  }
};

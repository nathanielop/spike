export default {
  up: async tx =>
    await tx.schema
      .table('players', t => {
        t.dropColumn('avatarStorageKey');
        t.boolean('isActive').notNullable();
        t.boolean('isAdmin').notNullable();
        t.text('nickname');
        t.text('emailAddress').notNullable();
        t.text('passwordHash').notNullable();
        t.unique('emailAddress');
      })
      .createTable('grants', t => {
        t.text('id').primary();
        t.text('playerId')
          .notNullable()
          .references('players.id')
          .onUpdate('CASCADE')
          .onDelete('CASCADE');
        t.text('secret').notNullable();
        t.datetime('createdAt').notNullable();
      })
      .table('seriesTeams', t => {
        t.dropColumn('score');
      })
      .table('games', t => {
        t.text('losingTeamId')
          .references('seriesTeams.id')
          .onUpdate('CASCADE')
          .onDelete('CASCADE');
        t.integer('winningTeamScore');
        t.integer('losingTeamScore');
        t.datetime('completedAt');
      }),
  down: async tx =>
    await tx.schema
      .table('players', t => {
        t.text('avatarStorageKey');
        t.dropColumn('isActive');
        t.dropColumn('isAdmin');
        t.dropColumn('nickname');
        t.dropColumn('emailAddress');
        t.dropColumn('passwordHash');
      })
      .dropTable('grants')
      .table('seriesTeams', t => {
        t.integer('score');
      })
      .table('games', t => {
        t.dropColumn('losingTeamId');
        t.dropColumn('winningTeamScore');
        t.dropColumn('losingTeamScore');
      })
};

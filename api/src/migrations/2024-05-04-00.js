export default {
  up: async tx =>
    await tx.schema
      .raw('CREATE EXTENSION IF NOT EXISTS citext')
      .createTable('players', t => {
        t.text('id').primary();
        t.text('name').notNullable().unique();
        t.text('avatarStorageKey');
        t.datetime('createdAt').notNullable();
      })
      .createTable('series', t => {
        t.text('id').primary();
        t.specificType('format', 'citext').notNullable();
        t.datetime('createdAt').notNullable();
      })
      .createTable('seriesTeams', t => {
        t.text('id').primary();
        t.integer('score');
        t.text('seriesId')
          .notNullable()
          .references('series.id')
          .onUpdate('CASCADE')
          .onDelete('CASCADE');
        t.datetime('createdAt').notNullable();
      })
      .createTable('games', t => {
        t.text('id').primary();
        t.text('seriesId')
          .notNullable()
          .references('series.id')
          .onUpdate('CASCADE')
          .onDelete('CASCADE');
        t.text('winningTeamId')
          .references('seriesTeams.id')
          .onUpdate('CASCADE')
          .onDelete('CASCADE');
        t.datetime('createdAt').notNullable();
      })
      .createTable('seriesTeamMembers', t => {
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
        t.datetime('createdAt').notNullable();
      }),
  down: async tx =>
    await tx.schema
      .raw('DROP EXTENSION IF EXISTS citext')
      .dropTable('seriesTeams')
      .dropTable('games')
      .dropTable('seriesTeamMembers')
      .dropTable('players')
      .dropTable('series')
};

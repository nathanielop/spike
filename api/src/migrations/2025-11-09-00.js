export default {
  up: async tx =>
    await tx.schema.table('series', t => {
      t.text('winningSeriesTeamId')
        .references('seriesTeams.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
      t.text('losingSeriesTeamId')
        .references('seriesTeams.id')
        .onUpdate('CASCADE')
        .onDelete('CASCADE');
    }),
  down: async tx =>
    await tx.schema.table('series', t => {
      t.dropColumn('winningSeriesTeamId');
      t.dropColumn('losingSeriesTeamId');
    })
};

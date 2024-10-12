import createDbType from '#src/functions/create-db-type.js';

export default createDbType({
  table: 'games',
  local: {
    completedAt: { nullable: 'datetime' },
    losingTeamScore: { nullable: 'integer' },
    winnerTeamScore: { nullable: 'integer' }
  },
  references: {
    series: 'series',
    losingTeam: { nullable: 'seriesTeam' },
    winningTeam: { nullable: 'seriesTeam' }
  }
});

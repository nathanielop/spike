import createDbType from '#src/functions/create-db-type.js';

export default createDbType({
  table: 'games',
  references: {
    series: 'series',
    winningTeam: { nullable: 'seriesTeam' }
  }
});

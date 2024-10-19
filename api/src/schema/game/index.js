import createDbType from '#src/functions/create-db-type.js';
import losers from '#src/schema/game/losers.js';
import winners from '#src/schema/game/winners.js';

export default createDbType({
  table: 'games',
  local: {
    completedAt: { nullable: 'datetime' },
    losingTeamScore: { nullable: 'integer' },
    winningTeamScore: { nullable: 'integer' }
  },
  references: {
    series: 'series'
  },
  fields: {
    losers,
    winners
  }
});

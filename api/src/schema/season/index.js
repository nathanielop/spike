import createDbType from '#src/functions/create-db-type.js';

export default createDbType({
  table: 'seasons',
  local: {
    createdAt: 'datetime',
    endedAt: { nullable: 'datetime' },
    endsAt: { nullable: 'datetime' },
    season: 'integer'
  },
  references: {
    firstPlacePlayer: 'player',
    secondPlacePlayer: 'player',
    thirdPlacePlayer: 'player'
  }
});

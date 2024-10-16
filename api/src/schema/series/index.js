import createDbType from '#src/functions/create-db-type.js';
// import games from '#src/schema/series/games.js';
import teams from '#src/schema/series/teams.js';

export default createDbType({
  table: 'series',
  local: {
    bestOf: 'format',
    completedAt: { nullable: 'datetime' }
  },
  fields: {
    // games,
    teams
  }
});

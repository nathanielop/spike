import createDbType from '#src/functions/create-db-type.js';
// import games from '#src/schema/series/games.js';
// import teams from '#src/schema/series/teams.js';

export default createDbType({
  table: 'series',
  local: {
    format: 'format'
  }
  // fields: {
  //   games,
  //   teams
  // }
});
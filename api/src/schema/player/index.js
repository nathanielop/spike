import createDbType from '#src/functions/create-db-type.js';
import avatarUrl from '#src/schema/player/avatar-url.js';
import bets from '#src/schema/player/bets.js';
import games from '#src/schema/player/games.js';
import stats from '#src/schema/player/stats.js';
import streaks from '#src/schema/player/streaks.js';

export default createDbType({
  table: 'players',
  local: {
    credits: 'integer',
    id: 'id',
    isAdmin: 'boolean',
    name: 'string',
    nickname: { nullable: 'string' }
  },
  fields: {
    avatarUrl,
    bets,
    games,
    stats,
    streaks
  }
});

import createDbType from '#src/functions/create-db-type.js';
import avatarUrl from '#src/schema/player/avatar-url.js';
import bets from '#src/schema/player/bets.js';
import items from '#src/schema/player/items.js';
import series from '#src/schema/player/series.js';
import stats from '#src/schema/player/stats.js';
import streaks from '#src/schema/player/streaks.js';

export default createDbType({
  table: 'players',
  local: {
    credits: 'integer',
    dailyRewardLastClaimedAt: { nullable: 'datetime' },
    id: 'id',
    isAdmin: 'boolean',
    isSuperAdmin: 'boolean',
    name: 'string',
    nickname: { nullable: 'string' },
    points: 'integer'
  },
  fields: {
    avatarUrl,
    bets,
    items,
    series,
    stats,
    streaks
  }
});

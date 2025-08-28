import createDbType from '#src/functions/create-db-type.js';
import activeBounties from '#src/schema/player/active-bounties.js';
import avatarUrl from '#src/schema/player/avatar-url.js';
import bets from '#src/schema/player/bets.js';
import items from '#src/schema/player/items.js';
import placedBounties from '#src/schema/player/placed-bounties.js';
import rank from '#src/schema/player/rank.js';
import series from '#src/schema/player/series.js';
import stats from '#src/schema/player/stats.js';
import streaks from '#src/schema/player/streaks.js';
import totalBounties from '#src/schema/player/total-bounties.js';

export default createDbType({
  table: 'players',
  local: {
    credits: 'integer',
    dailyRewardLastClaimedAt: { nullable: 'datetime' },
    elo: 'integer',
    id: 'id',
    isActive: 'boolean',
    isAdmin: 'boolean',
    isSuperAdmin: 'boolean',
    name: 'string',
    nickname: { nullable: 'string' },
    points: 'integer'
  },
  fields: {
    activeBounties,
    avatarUrl,
    bets,
    items,
    placedBounties,
    rank,
    series,
    stats,
    streaks,
    totalBounties
  }
});

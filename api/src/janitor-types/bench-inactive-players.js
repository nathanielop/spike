import config from '#src/config.js';
import db from '#src/constants/db.js';

const { version } = config;

const inactivePeriod = 1000 * 60 * 60 * 24 * 30;

// Mark players as inactive if they haven't played in the last 30 days
export default async () =>
  version === 'production' &&
  (await db
    .table('players')
    .update({ isActive: false })
    .where('createdAt', '<', new Date(Date.now() - inactivePeriod)) // Only consider players created before the inactive period
    .whereNotExists(query =>
      query
        .select()
        .from('seriesTeamMembers')
        .whereColumn('playerId', 'players.id')
        .where('createdAt', '>', new Date(Date.now() - inactivePeriod))
    ));

import config from '#src/config.js';

const { version } = config;

const inactivePeriod = 1000 * 60 * 60 * 24 * 30;

const decayRate = 1000 * 60 * 60 * 24 * 7;

const fn = async ({ load }) => {
  if (version !== 'production') return;

  await load.tx
    .table('players')
    .update({ isActive: false })
    .where('createdAt', '<', new Date(Date.now() - inactivePeriod)) // Only consider players created before the inactive period
    .whereNotExists(query =>
      query
        .select()
        .from('seriesTeamMembers')
        .whereColumn('playerId', 'players.id')
        .where('createdAt', '>', new Date(Date.now() - inactivePeriod))
    );
};

export default Object.assign(fn, { runEvery: decayRate });

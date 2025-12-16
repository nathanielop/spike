import ranks from '#src/constants/ranks.js';

const minimumSeries = 25;

// Player IDs who are excluded from the minimum series requirement
const excludedPlayerIds = ['LX26XGOaW0TB'];

export default async ({ load, playerId }) => {
  if (!excludedPlayerIds.includes(playerId)) {
    const [{ count }] = await load.tx
      .count()
      .from('series')
      .whereExists(query =>
        query
          .select()
          .from('seriesTeams')
          .join(
            'seriesTeamMembers',
            'seriesTeamMembers.seriesTeamId',
            'seriesTeams.id'
          )
          .whereColumn('seriesTeams.seriesId', 'series.id')
          .where('seriesTeamMembers.playerId', playerId)
      );

    if (count < minimumSeries) return;
  }

  const { elo } = await load('players', playerId);
  const [rank] = /** @type {[string, number[]]} */ (
    Object.entries(ranks).find(
      ([, [min, max]]) => elo >= min && (!max || elo <= max)
    )
  );
  return rank;
};

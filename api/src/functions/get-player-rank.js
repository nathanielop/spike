import ranks from '#src/constants/ranks.js';

const minimumSeries = 25;

export default async ({ load, playerId }) => {
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

  const { elo } = await load('players', playerId);
  const [rank] = /** @type {[string, number[]]} */ (
    Object.entries(ranks).find(
      ([, [min, max]]) => elo >= min && (!max || elo <= max)
    )
  );
  return rank;
};

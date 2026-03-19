import getCurrentSeason from '#src/functions/get-current-season.js';

export default async ({ isWins, load, playerId }) => {
  const currentSeason = await getCurrentSeason(load);

  const [last] = await load.tx
    .select()
    .from('series')
    .whereRaw(
      isWins
        ? `series."losingSeriesTeamId" = ??`
        : `series."winningSeriesTeamId" = ??`,
      [
        query =>
          query
            .select('seriesTeams.id')
            .from('seriesTeamMembers')
            .join(
              'seriesTeams',
              'seriesTeams.id',
              'seriesTeamMembers.seriesTeamId'
            )
            .whereColumn('seriesTeams.seriesId', 'series.id')
            .where({ playerId })
      ]
    )
    .where({ seasonId: currentSeason.id })
    .orderBy('completedAt', 'desc')
    .limit(1);

  const [{ count: currentStreak }] = await load.tx
    .count()
    .from('series')
    .join('seriesTeams', 'seriesTeams.id', 'series.id')
    .join(
      'seriesTeamMembers',
      'seriesTeamMembers.seriesTeamId',
      'seriesTeams.id'
    )
    .where({ playerId, seasonId: currentSeason.id })
    .where(
      'series.completedAt',
      '>=',
      new Date(last?.completedAt ?? 0).toISOString()
    );

  return currentStreak;
};

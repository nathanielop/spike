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
    .whereNotExists(query =>
      query
        .select()
        .from('series as os')
        .whereRaw(
          isWins
            ? `os."winningSeriesTeamId" = ??`
            : `os."losingSeriesTeamId" = ??`,
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
                .whereColumn('seriesTeams.seriesId', 'os.id')
                .where({ playerId })
          ]
        )
        .where('os.seasonId', currentSeason.id)
        .whereColumn('os.completedAt', '<', 'series.completedAt')
    )
    .where({ seasonId: currentSeason.id })
    .orderBy('completedAt', 'asc')
    .limit(1);

  if (!last) return 0;

  const [{ count: currentStreak }] = await load.tx
    .count('series.id')
    .from('series')
    .whereExists(query =>
      query
        .select('seriesTeams.id')
        .from('seriesTeamMembers')
        .join('seriesTeams', 'seriesTeams.id', 'seriesTeamMembers.seriesTeamId')
        .whereColumn('seriesTeams.seriesId', 'series.id')
        .where({ playerId })
    )
    .where({ seasonId: currentSeason.id })
    .where(
      'series.completedAt',
      '>=',
      new Date(last.completedAt).toISOString()
    );

  return currentStreak;
};

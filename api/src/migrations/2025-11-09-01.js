import groupBy from '#src/functions/group-by.js';

export default {
  up: async tx => {
    const seriesToUpdate = await tx
      .select('series.id', query =>
        query
          .select('seriesTeams.id')
          .from('seriesTeams')
          .whereColumn('seriesTeams.seriesId', 'series.id')
          .whereRaw(`? > series."bestOf" / 2`, [
            query =>
              query
                .count()
                .from('games')
                .whereColumn('games.seriesId', 'series.id')
                .whereColumn('games.winningTeamId', 'seriesTeams.id')
          ])
          .as('winningTeamId')
      )
      .from('series')
      .whereNull('winningSeriesTeamId');

    if (!seriesToUpdate.length) return;

    const seriesTeams = await tx
      .select('id', 'seriesId')
      .from('seriesTeams')
      .whereIn(
        'seriesId',
        seriesToUpdate.map(({ id }) => id)
      );

    const bySeriesId = groupBy(seriesTeams, 'seriesId');

    for (const series of seriesToUpdate) {
      if (series.winningTeamId === null) continue;

      const teams = bySeriesId[series.id];
      const winningTeam = teams.find(team => team.id === series.winningTeamId);
      if (!winningTeam) {
        throw new Error(`No winning team found for series ${series.id}`);
      }

      const losingTeam = teams.find(team => team.id !== winningTeam.id);
      if (!losingTeam) {
        throw new Error(`No losing team found for series ${series.id}`);
      }

      await tx
        .table('series')
        .update({
          winningSeriesTeamId: winningTeam.id,
          losingSeriesTeamId: losingTeam.id
        })
        .where('id', series.id);
    }
  },

  down: async () => {}
};

export default {
  type: { arrayOf: 'series' },
  resolve: async ({ context: { load, player }, object: { id } }) => {
    if (player.id !== id) return [];

    return await load.tx
      .select('series.*')
      .from('series')
      .join('seriesTeams', 'seriesTeams.seriesId', 'series.id')
      .join(
        'seriesTeamMembers',
        'seriesTeamMembers.seriesTeamId',
        'seriesTeams.id'
      )
      .where({ playerId: id })
      .limit(10)
      .orderBy('series.createdAt', 'desc');
  }
};

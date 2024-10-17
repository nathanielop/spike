export default {
  type: { arrayOf: 'game' },
  resolve: async ({ context: { load, player }, object: { id } }) => {
    if (player.id !== id) return [];

    return await load.tx
      .select('games.*')
      .from('games')
      .join('series', 'series.id', 'games.seriesId')
      .join('seriesTeams', 'seriesTeams.seriesId', 'series.id')
      .join(
        'seriesTeamMembers',
        'seriesTeamMembers.seriesTeamId',
        'seriesTeams.id'
      )
      .where({ playerId: id })
      .orderBy('games.createdAt', 'desc');
  }
};

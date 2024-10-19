export default {
  type: { arrayOf: 'player' },
  resolve: async ({ context: { load }, object: { id } }) =>
    await load.tx
      .select('players.id')
      .from('games')
      .join('seriesTeams', 'seriesTeams.seriesId', 'games.seriesId')
      .join(
        'seriesTeamMembers',
        'seriesTeamMembers.seriesTeamId',
        'seriesTeams.id'
      )
      .join('players', 'players.id', 'seriesTeamMembers.playerId')
      .whereColumn('seriesTeams.id', 'games.losingTeamId')
      .where({ 'games.id': id })
};

import groupBy from '#src/functions/group-by.js';

export default {
  type: { arrayOf: { object: { players: { arrayOf: 'player' }, id: 'id' } } },
  resolve: async ({ context: { load }, object: { id } }) => {
    const players = await load.tx
      .select('players.id', 'seriesTeams.id as seriesTeamId')
      .from('players')
      .join('seriesTeamMembers', 'seriesTeamMembers.playerId', 'players.id')
      .join('seriesTeams', 'seriesTeams.id', 'seriesTeamMembers.seriesTeamId')
      .where({ seriesId: id });

    return Object.entries(groupBy(players, 'seriesTeamId')).map(
      ([id, players]) => ({ id, players })
    );
  }
};

import getGameOdds from '#src/functions/get-game-odds.js';
import groupBy from '#src/functions/group-by.js';

export default {
  type: {
    arrayOf: {
      object: { players: { arrayOf: 'player' }, id: 'id', odds: 'number' }
    }
  },
  resolve: async ({ context: { load }, object: { id } }) => {
    const players = await load.tx
      .select('players.id', 'players.elo', 'seriesTeams.id as seriesTeamId')
      .from('players')
      .join('seriesTeamMembers', 'seriesTeamMembers.playerId', 'players.id')
      .join('seriesTeams', 'seriesTeams.id', 'seriesTeamMembers.seriesTeamId')
      .where({ seriesId: id });

    const byTeamId = groupBy(players, 'seriesTeamId');
    const oddsByTeamId = Object.fromEntries(
      getGameOdds(...Object.values(byTeamId)).map((odds, i) => [
        Object.keys(byTeamId)[i],
        odds
      ])
    );

    return Object.entries(byTeamId).map(([id, players]) => ({
      id,
      players,
      odds: oddsByTeamId[id]
    }));
  }
};

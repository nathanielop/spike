import ranks from '#src/constants/ranks.js';

export default {
  type: {
    nullable: {
      object: {
        wins: 'integer',
        losses: 'integer',
        winRate: 'number',
        rank: 'rank'
      }
    }
  },
  resolve: async ({ context: { load, player }, object: { id } }) => {
    if (player.id !== id) return;

    let [{ count: wins }] = await load.tx
      .count()
      .from('seriesTeamMembers')
      .join('seriesTeams', 'seriesTeams.id', 'seriesTeamMembers.seriesTeamId')
      .where({ playerId: id })
      .whereExists(query =>
        query
          .select()
          .from('games')
          .whereColumn('winningTeamId', 'seriesTeams.id')
      );

    let [{ count: losses }] = await load.tx
      .count()
      .from('seriesTeamMembers')
      .join('seriesTeams', 'seriesTeams.id', 'seriesTeamMembers.seriesTeamId')
      .where({ playerId: id })
      .whereExists(query =>
        query
          .select()
          .from('games')
          .whereColumn('losingTeamId', 'seriesTeams.id')
      );

    wins = Number(wins);
    losses = Number(losses);

    const { elo } = await load('players', id);

    return {
      wins,
      losses,
      winRate: wins / (wins + losses),
      rank: Object.entries(ranks).find(
        ([, [min, max]]) => elo >= min && (!max || elo <= max)
      )[0]
    };
  }
};

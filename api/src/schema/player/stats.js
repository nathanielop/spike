import getCurrentSeason from '#src/functions/get-current-season.js';
import getPlayerRank from '#src/functions/get-player-rank.js';

export default {
  type: {
    nullable: {
      object: {
        wins: 'integer',
        losses: 'integer',
        winRate: 'number',
        rank: { nullable: 'rank' }
      }
    }
  },
  resolve: async ({ context: { load, player }, object: { id } }) => {
    if (player.id !== id) return;
    const currentSeason = await getCurrentSeason(load);

    let [{ count: wins }] = await load.tx
      .count()
      .from('games')
      .join('seriesTeams', 'seriesTeams.id', 'games.winningTeamId')
      .join('series', 'series.id', 'seriesTeams.seriesId')
      .join(
        'seriesTeamMembers',
        'seriesTeamMembers.seriesTeamId',
        'seriesTeams.id'
      )
      .where({ playerId: id, seasonId: currentSeason.id });

    let [{ count: losses }] = await load.tx
      .count()
      .from('games')
      .join('seriesTeams', 'seriesTeams.id', 'games.losingTeamId')
      .join('series', 'series.id', 'seriesTeams.seriesId')
      .join(
        'seriesTeamMembers',
        'seriesTeamMembers.seriesTeamId',
        'seriesTeams.id'
      )
      .where({ playerId: id, seasonId: currentSeason.id });

    wins = Number(wins);
    losses = Number(losses);

    return {
      wins,
      losses,
      winRate: wins / (wins + losses),
      rank: await getPlayerRank({ load, playerId: id })
    };
  }
};

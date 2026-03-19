import getCurrentSeason from '#src/functions/get-current-season.js';
import getPlayerRank from '#src/functions/get-player-rank.js';
import getStreak from '#src/functions/get-streak.js';

export default {
  type: {
    nullable: {
      object: {
        wins: 'integer',
        winStreak: 'integer',
        lossStreak: 'integer',
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
      .from('series')
      .join('seriesTeams', 'seriesTeams.id', 'series.winningSeriesTeamId')
      .join(
        'seriesTeamMembers',
        'seriesTeamMembers.seriesTeamId',
        'seriesTeams.id'
      )
      .where({ playerId: id, seasonId: currentSeason.id });

    let [{ count: losses }] = await load.tx
      .count()
      .from('series')
      .join('seriesTeams', 'seriesTeams.id', 'series.losingSeriesTeamId')
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
      winStreak: await getStreak({ isWins: true, load, playerId: id }),
      lossStreak: await getStreak({ isWins: false, load, playerId: id }),
      rank: await getPlayerRank({ load, playerId: id })
    };
  }
};

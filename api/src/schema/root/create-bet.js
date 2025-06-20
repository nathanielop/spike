import PublicError from '#src/constants/public-error.js';
import createId from '#src/functions/create-id.js';
import getGameOdds from '#src/functions/get-game-odds.js';
import getPlayerRank from '#src/functions/get-player-rank.js';
import groupBy from '#src/functions/group-by.js';

const betTimeLimit = 1000 * 60 * 5;

export default {
  type: 'root',
  input: {
    object: {
      amount: { type: 'integer', typeArgs: { min: 0 } },
      teamId: 'id'
    }
  },
  resolve: async ({ context: { load, player }, input: { amount, teamId } }) => {
    const team = await load('seriesTeams', teamId);
    if (!team || !player) {
      throw new PublicError(
        'You do not have permission to place a bet on this series'
      );
    }

    const series = await load('series', team.seriesId);
    if (series.modifier) {
      throw new PublicError(
        'You cannot place a bet on a series with a modifier'
      );
    }

    const seriesGame = await load.tx
      .first()
      .from('games')
      .where({ seriesId: series.id })
      .whereNotNull('completedAt');
    if (
      !!seriesGame ||
      series.completedAt ||
      series.createdAt < Date.now() - betTimeLimit
    ) {
      throw new PublicError('Betting is closed for this series');
    }

    if (amount > player.credits) {
      throw new PublicError('You do not have enough credits to place this bet');
    }

    const [{ count }] = await load.tx
      .count()
      .from('bets')
      .join('seriesTeams', 'seriesTeams.id', 'bets.seriesTeamId')
      .where({ seriesId: series.id, playerId: player.id });
    if (count > 0) {
      throw new PublicError('You have already placed a bet on this series');
    }

    const seriesPlayers = await load.tx
      .select('seriesTeamMembers.*', 'players.name', 'players.elo')
      .from('seriesTeamMembers')
      .join('seriesTeams', 'seriesTeams.id', 'seriesTeamMembers.seriesTeamId')
      .join('players', 'players.id', 'seriesTeamMembers.playerId')
      .where({ seriesId: series.id });
    const matchingSeriesPlayer = seriesPlayers.find(
      ({ playerId }) => playerId === player.id
    );
    if (matchingSeriesPlayer && matchingSeriesPlayer.seriesTeamId !== teamId) {
      throw new PublicError('You cannot bet against yourself');
    }

    const allPlayersRanked = (
      await Promise.all(
        seriesPlayers.map(
          async ({ playerId }) => await getPlayerRank({ load, playerId })
        )
      )
    ).every(rank => !!rank);
    if (!allPlayersRanked) {
      throw new PublicError(
        'All players must be ranked to place a bet on this series'
      );
    }

    const byTeamId = groupBy(seriesPlayers, 'seriesTeamId');
    const oddsByTeamId = Object.fromEntries(
      getGameOdds(...Object.values(byTeamId)).map((odds, i) => [
        Object.keys(byTeamId)[i],
        odds
      ])
    );

    const id = createId();
    await load.tx.transaction(async tx => {
      await tx
        .table('players')
        .update({ credits: player.credits - amount })
        .where({ id: player.id });

      await tx
        .insert({
          id,
          isActive: true,
          playerId: player.id,
          seriesTeamId: teamId,
          amount,
          payRate: 1 / oddsByTeamId[teamId],
          createdAt: new Date()
        })
        .into('bets');
    });

    return { createdBet: { id } };
  }
};

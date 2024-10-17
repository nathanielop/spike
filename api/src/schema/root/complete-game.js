import PublicError from '#src/constants/public-error.js';
import getGameOdds from '#src/functions/get-game-odds.js';
import groupBy from '#src/functions/group-by.js';
import indexBy from '#src/functions/index-by.js';
import postToSlack from '#src/functions/post-to-slack.js';

const { console } = globalThis;

const kFactor = 32;

export default {
  type: 'root',
  input: {
    object: {
      id: 'id',
      losingTeamId: 'id',
      losingTeamScore: { type: 'integer', typeArgs: { min: 0 } },
      winningTeamId: 'id',
      winningTeamScore: { type: 'integer', typeArgs: { min: 0 } }
    },
    validate: ({ value }) => {
      if (value.winningTeamScore - value.losingTeamScore < 2) {
        throw new PublicError('Winning team must win by at least 2 points');
      }

      if (value.losingTeamScore < 11 && value.winningTeamScore < 11) {
        throw new PublicError('Scores must be at least 11');
      }

      return value;
    }
  },
  resolve: async ({
    input: {
      id,
      losingTeamId,
      losingTeamScore,
      winningTeamId,
      winningTeamScore
    },
    context: { load, player, shouldNotify }
  }) => {
    const game = await load('games', id);
    if (!game || !player?.isAdmin) {
      throw new PublicError("You don't have permission to update this game");
    }

    if (game.completedAt) {
      throw new PublicError('This game has already been completed');
    }

    const players = await load.tx
      .select(
        'players.id',
        'players.name',
        'players.credits',
        'players.elo',
        'seriesTeamMembers.seriesTeamId'
      )
      .from('players')
      .join('seriesTeamMembers', 'seriesTeamMembers.playerId', 'players.id')
      .join('seriesTeams', 'seriesTeams.id', 'seriesTeamMembers.seriesTeamId')
      .where({ seriesId: game.seriesId });
    const playersById = indexBy(players, 'id');
    const teams = groupBy(players, 'seriesTeamId');

    const playersToElo = {};
    const winningTeam = players.filter(
      player => player.seriesTeamId === winningTeamId
    );
    const winningTeamIds = winningTeam.map(({ id }) => id);
    const losingTeam = players.filter(
      player => player.seriesTeamId === losingTeamId
    );

    const odds = getGameOdds(winningTeam, losingTeam);

    const expectedDifference = (odds[0] - odds[1]) * 11;
    const actualDifference = winningTeamScore - losingTeamScore;
    const amplifier = 1 + (actualDifference - expectedDifference) / 10;
    for (const player of winningTeam) {
      playersToElo[player.id] = player.elo + kFactor * amplifier;
    }

    for (const player of losingTeam) {
      playersToElo[player.id] = Math.max(player.elo - kFactor * amplifier, 0);
    }

    let totalPaidOut = 0;
    let totalPlayersPaid = 0;
    let totalLost = 0;
    let totalPlayersLost = 0;
    await load.tx.transaction(async tx => {
      await tx
        .table('games')
        .update({
          completedAt: new Date(),
          losingTeamScore,
          winningTeamScore,
          winningTeamId,
          losingTeamId
        })
        .where({ id });

      const [{ bestOf, gameCount }] = await tx
        .select('bestOf', tx.raw('count(games.id) as "gameCount"'))
        .from('series')
        .where('series.id', game.seriesId)
        .join('games', 'games.seriesId', 'series.id')
        .groupBy('series.id');

      const games = await tx
        .select()
        .from('games')
        .where({ seriesId: game.seriesId });

      const byWinningTeamId = groupBy(games, 'winningTeamId');
      const seriesWinner = Object.entries(byWinningTeamId).find(
        ([, games]) => games.length >= Math.ceil(bestOf / 2)
      );
      if (bestOf === gameCount || seriesWinner) {
        const [seriesWinnerTeamId] = seriesWinner;

        await tx
          .table('series')
          .update({ completedAt: new Date() })
          .where({ id: game.seriesId });

        const bets = await tx
          .select('bets.*', 'players.credits as playerCredits')
          .from('bets')
          .join('seriesTeams', 'seriesTeams.id', 'bets.seriesTeamId')
          .where({ seriesId: game.seriesId })
          .join('players', 'players.id', 'bets.playerId');

        if (bets.length) {
          const playerValues = [];
          const betValues = bets.map(bet => {
            const paidOutAmount =
              bet.seriesTeamId === seriesWinnerTeamId
                ? Math.round(bet.amount * bet.payRate)
                : null;
            if (paidOutAmount) {
              totalPaidOut += paidOutAmount;
              totalPlayersPaid++;
              playerValues.push([
                bet.playerId,
                paidOutAmount + bet.playerCredits
              ]);
            } else {
              totalPlayersLost++;
              totalLost += bet.amount;
            }
            return [bet.id, paidOutAmount, false];
          });

          if (playerValues.length) {
            await tx.raw(
              `
              update players
              set credits = data.credits::integer
              from (values ${Array.from(playerValues, () => '(?, ?)').join(
                ', '
              )}) as data (id, credits)
              where players.id = data.id
              `,
              playerValues.flat()
            );
          }

          await tx.raw(
            `
            update bets
            set "paidOutAmount" = data."paidOutAmount"::integer, "isActive" = data."isActive"::boolean
            from (values ${Array.from(betValues, () => '(?, ?, ?)').join(
              ', '
            )}) as data (id, "paidOutAmount", "isActive")
            where bets.id = data.id
            `,
            betValues.flat()
          );
        }
      }

      for (const [id, elo] of Object.entries(playersToElo)) {
        await tx
          .table('players')
          .update({
            elo: Math.round(elo),
            credits:
              playersById[id].credits +
              10 +
              (winningTeamIds.includes(id) ? 10 : 0)
          })
          .where({ id });
      }
    });

    if (shouldNotify !== false) {
      try {
        const bettingMessage = [].concat(
          totalPaidOut
            ? `${totalPaidOut} credits paid out to ${totalPlayersPaid} player${totalPlayersPaid > 1 ? 's' : ''}`
            : [],
          totalLost
            ? `${totalLost} credits lost by ${totalPlayersLost} player${totalPlayersLost > 1 ? 's' : ''}`
            : []
        );
        await postToSlack({
          subject: `${teams[winningTeamId].map(({ name }) => name).join(' & ')} defeated ${teams[losingTeamId].map(({ name }) => name).join(' & ')}`,
          message: bettingMessage.length
            ? bettingMessage.join(' and ')
            : undefined,
          title: `*WE 🙂 WIN \`${winningTeamScore}-${losingTeamScore}\`*`
        });
      } catch (er) {
        console.log('Error sending slack message', er);
      }
    }
  }
};

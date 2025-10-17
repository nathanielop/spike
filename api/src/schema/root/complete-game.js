import pave from 'pave';

import PublicError from '#src/constants/public-error.js';
import createLoad from '#src/functions/create-load.js';
import getGameOdds from '#src/functions/get-game-odds.js';
import groupBy from '#src/functions/group-by.js';
import indexBy from '#src/functions/index-by.js';
import postToSlack from '#src/functions/post-to-slack.js';

const { console } = globalThis;

const kFactor = 48;

const formatter = Intl.NumberFormat('en-US');

export default {
  type: 'root',
  input: {
    object: {
      id: 'id',
      losingTeamId: 'id',
      losingTeamScore: { type: 'integer', typeInput: { min: 0 } },
      winningTeamId: 'id',
      winningTeamScore: { type: 'integer', typeInput: { min: 0 } }
    },
    validate: ({ value }) => {
      if (value.winningTeamScore - value.losingTeamScore < 2) {
        throw new PublicError('Winning team must win by at least 2 points');
      }

      if (value.losingTeamScore < 11 && value.winningTeamScore < 11) {
        throw new PublicError('Scores must be at least 11');
      }

      if (
        value.winningTeamScore > 11 &&
        value.winningTeamScore - value.losingTeamScore !== 2
      ) {
        throw new PublicError('Winning team must win by 2 points');
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
    schema,
    context,
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
        'players.points',
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
    let totalBountiesPaid = 0;
    let totalLost = 0;
    let totalPlayersLost = 0;
    let totalBets;
    const paidPlayerAmounts = {};
    let createdGameId;
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
              if (bet.playerId in playersToElo) {
                paidPlayerAmounts[bet.playerId] = paidOutAmount;
              } else {
                playerValues.push([
                  bet.playerId,
                  paidOutAmount + bet.playerCredits
                ]);
              }
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
              set credits = data.credits::bigint
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

        const bounties = await tx
          .select()
          .from('bounties')
          .whereIn(
            'placedOnPlayerId',
            players.map(({ id }) => id)
          )
          .where({ isClaimed: false });

        if (bounties.length) {
          const { paid = [], collected = [] } = groupBy(
            bounties,
            ({ placedOnPlayerId }) =>
              winningTeamIds.includes(placedOnPlayerId) ? 'collected' : 'paid'
          );

          const exhaustedIds = [];
          const bountyValues = [];
          totalBountiesPaid = [
            ...paid.map(({ amount }) => amount),
            ...collected.map(({ id, amount }) => {
              if (amount < 1000) {
                exhaustedIds.push(id);
                return amount;
              } else {
                const reduction = amount * 0.1;
                bountyValues.push([id, Math.floor(amount - reduction)]);
                return reduction;
              }
            })
          ].reduce((sum, amount) => sum + amount, 0);

          if (paid.length) {
            await tx
              .table('bounties')
              .update({ isClaimed: true })
              .whereIn(
                'id',
                paid.map(({ id }) => id)
              );
          }

          if (exhaustedIds.length) {
            await tx.delete().from('bounties').whereIn('id', exhaustedIds);
          }

          if (bountyValues.length) {
            await tx.raw(
              `
              update bounties
              set amount = data.amount::integer
              from (values ${Array.from(bountyValues, () => '(?, ?)').join(
                ', '
              )}) as data (id, amount)
              where bounties.id = data.id
              `,
              bountyValues.flat()
            );
          }
        }
      } else {
        if (gameCount === 0 && bestOf !== 1) {
          totalBets = (
            await tx
              .sum('amount')
              .from('bets')
              .join('seriesTeams', 'seriesTeams.id', 'bets.seriesTeamId')
              .where({ seriesId: game.seriesId })
          )[0].sum;
        }

        const {
          createGame: { createdGame }
        } = await pave.execute({
          query: {
            createGame: {
              $: { seriesId: game.seriesId },
              createdGame: { id: {} }
            }
          },
          context: { ...context, load: createLoad({ tx }) },
          schema,
          type: 'root'
        });

        createdGameId = createdGame.id;
      }

      for (const [id, elo] of Object.entries(playersToElo)) {
        await tx
          .table('players')
          .update({
            elo: Math.round(elo),
            points:
              playersById[id].points +
              (winningTeamIds.includes(id)
                ? Math.round(
                    5 * (1 + Math.max(actualDifference - expectedDifference, 0))
                  )
                : 0),
            credits:
              playersById[id].credits +
              10 +
              (paidPlayerAmounts[id] || 0) +
              (winningTeamIds.includes(id) ? 10 : 0) +
              // The following math might not be correct for distribution but don't really care about +- 1 credit
              (winningTeamIds.includes(id) && totalBountiesPaid
                ? Math.floor(totalBountiesPaid / winningTeamIds.length)
                : 0)
          })
          .where({ id });
      }
    });

    if (shouldNotify !== false) {
      try {
        const bettingMessage = /** @type {string[]} */ ([]).concat(
          totalPaidOut
            ? `*${formatter.format(totalPaidOut)} credits paid out to ${totalPlayersPaid} player${totalPlayersPaid > 1 ? 's' : ''}*`
            : [],
          totalLost
            ? `*${formatter.format(totalLost)} credits lost by ${totalPlayersLost} player${totalPlayersLost > 1 ? 's' : ''}*`
            : [],
          totalBets
            ? `*${formatter.format(totalBets)} total credits at stake*`
            : [],
          totalBountiesPaid
            ? `*${formatter.format(totalBountiesPaid)} credits paid out in bounties*`
            : []
        );
        await postToSlack({
          subject: `${teams[winningTeamId].map(({ name }) => name).join(' & ')} defeated ${teams[losingTeamId].map(({ name }) => name).join(' & ')}`,
          message: bettingMessage.length
            ? bettingMessage.join('\n')
            : undefined,
          title: `*WE 🙂 WIN \`${winningTeamScore}-${losingTeamScore}\`*`
        });
      } catch (er) {
        console.log('Error sending slack message', er);
      }
    }

    if (createdGameId) return { createdGame: { id: createdGameId } };
  }
};

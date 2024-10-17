import fs from 'node:fs/promises';

import pave from 'pave';

import createLoad from '#src/functions/create-load.js';
import schema from '#src/schema/index.js';

const { console } = globalThis;

const playersToIds = {
  1: 'GHin7KI7H8Nc',
  2: 'cqiD07ZlYIkU',
  3: 'k4NRcqABrK91',
  4: 'Is3WXZjmdKrw',
  5: '8FcZ7TFwFJAY',
  6: 'GKay3pMqCJpI',
  7: 'WvuTVJOjMLqv',
  8: 'XMGhvMsRbzj4',
  9: 'WEC4z0kAKHiq',
  10: '9ha37dLKuiJ7',
  11: 'tXsfdYz26W9t',
  12: 'vfeZj9JRQHIt',
  13: 'MofJ7lLPPFzM',
  14: 'jH5iZlmyOp4X',
  15: 'GIogRlcQjo3h',
  16: 'tXQzsKIVCG3V',
  17: 'iGiWHMV9dsHR',
  18: 'zsilC40yXG4f',
  19: 'Wz0ZB7CNZASN',
  20: '9EGvMPN047II',
  21: 'LUZG8OT9gwB1',
  22: 'FhXO3BSAd8Dm'
};

const getPlayerIds = game => {
  const { winner, loser } = game;
  const winningTeamPlayerIds = [winner.team[0], winner.team[1]].map(
    player => playersToIds[player]
  );
  const losingTeamPlayerIds = [loser.team[0], loser.team[1]].map(
    player => playersToIds[player]
  );
  return [winningTeamPlayerIds, losingTeamPlayerIds];
};

export default {
  up: async tx => {
    await tx.delete().from('series');

    await tx.table('players').update({ elo: 1000, credits: 1000 });

    const load = createLoad({ tx });

    const paveExecute = async query =>
      await pave.execute({
        query,
        context: { load, player: { isAdmin: true }, shouldNotify: false },
        schema,
        type: 'root'
      });

    const backfill = await fs.readFile('src/migrations/backfill.txt', {
      encoding: 'utf8'
    });

    if (!backfill) return console.log('No backfill data found, continuing...');

    const games = JSON.parse(
      `[${backfill
        .split('\n')
        .flatMap(line => line?.trim() || [])
        .join(',')}]`
    );

    const series = [];
    for (const i in games) {
      if (!games[i - 1]) series.push([games[i]]);
      else {
        const prevIds = getPlayerIds(games[i - 1])
          .flat()
          .sort();
        const currentIds = getPlayerIds(games[i]).flat().sort();
        if (JSON.stringify(prevIds) === JSON.stringify(currentIds)) {
          series.at(-1).push(games[i]);
        } else series.push([games[i]]);
      }
    }

    for (const games of series) {
      const { winner, loser } = games[0];
      const [winnerIds, loserIds] = getPlayerIds(games[0]);

      const {
        createSeriesAndGame: { createdSeries, createdGame }
      } = await paveExecute({
        createSeriesAndGame: {
          $: {
            bestOf: games.length === 1 ? 1 : 3,
            players: [
              ...winnerIds.map(id => ({ id, team: 0 })),
              ...loserIds.map(id => ({ id, team: 1 }))
            ]
          },
          createdSeries: {
            id: {},
            bestOf: {},
            teams: {
              id: {},
              players: { id: {}, name: {}, avatarUrl: { $: { size: 200 } } }
            }
          },
          createdGame: { id: {} }
        }
      });

      console.log(createdSeries, winnerIds, loserIds);

      await paveExecute({
        completeGame: {
          $: {
            id: createdGame.id,
            losingTeamId: createdSeries.teams.find(({ players }) =>
              players.every(({ id }) => loserIds.includes(id))
            ).id,
            losingTeamScore: loser.score,
            winningTeamId: createdSeries.teams.find(({ players }) =>
              players.every(({ id }) => winnerIds.includes(id))
            ).id,
            winningTeamScore: winner.score
          }
        }
      });

      for (let i = 0; i < games.slice(1).length; i++) {
        const game = games[i + 1];
        const { winner, loser } = game;
        const [winnerIds, loserIds] = getPlayerIds(game);

        const {
          createGame: { createdGame }
        } = await paveExecute({
          createGame: {
            $: { seriesId: createdSeries.id },
            createdGame: { id: {} }
          }
        });

        await paveExecute({
          completeGame: {
            $: {
              id: createdGame.id,
              losingTeamId: createdSeries.teams.find(({ players }) =>
                players.every(({ id }) => loserIds.includes(id))
              ).id,
              losingTeamScore: loser.score,
              winningTeamId: createdSeries.teams.find(({ players }) =>
                players.every(({ id }) => winnerIds.includes(id))
              ).id,
              winningTeamScore: winner.score
            }
          }
        });
      }
    }
  },
  down: async tx => {
    await tx.delete().from('series');

    await tx.table('players').update({ elo: 1000, credits: 1000 });
  }
};

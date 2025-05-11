import db from '#src/constants/db.js';

const decayRate = 1000 * 60 * 60 * 24 * 7;

const fn = async ({ load }) => {
  const validPlayers = await load.tx
    .select()
    .from('players')
    .where('createdAt', '<', new Date(Date.now() - decayRate)) // Only consider players created before the inactive period
    .whereNotExists(query =>
      query
        .select()
        .from('seriesTeamMembers')
        .whereColumn('playerId', 'players.id')
        .where('createdAt', '>', new Date(Date.now() - decayRate))
    );

  console.log(
    validPlayers.map(
      ({ id, elo }) =>
        `${id}: ${elo < 250 ? elo : Math.ceil((elo - 250) * 0.9 + 250)}`
    )
  );

  if (!validPlayers.length) return;

  // await load.tx
  //   .table('players')
  //   .update({
  //     elo: db.raw(
  //       'case when elo < 250 then elo else ceil(((elo - 250) * 0.9) + 250)::integer end'
  //     )
  //   })
  //   .whereIn(
  //     'id',
  //     validPlayers.map(({ id }) => id)
  //   );
};

// Decay elo every week by 10%
export default Object.assign(fn, { runEvery: decayRate });

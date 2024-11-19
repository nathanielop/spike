import db from '#src/constants/db.js';

const { console } = globalThis;

const staleSeriesDuration = 60 * 60; // stagnate after an hour

const execute = async () => {
  console.log('[cleaning stale games]');
  const staleSeries = await db
    .select()
    .from('series')
    .whereNull('completedAt')
    .where('createdAt', '<', new Date(Date.now() - staleSeriesDuration * 1000));

  for (const series of staleSeries) {
    const seriesTeamIds = await db
      .pluck('id')
      .from('seriesTeams')
      .where('seriesId', series.id);
    const bets = await db
      .select()
      .from('bets')
      .whereIn('seriesTeamId', seriesTeamIds);

    for (const bet of bets) {
      await db
        .table('players')
        .update({ credits: db.raw('credits + ?', [bet.amount]) })
        .where('id', bet.playerId);
      await db.delete().from('bets').where('id', bet.id);
    }

    await db
      .table('series')
      .update({ completedAt: new Date() })
      .where('id', series.id);
  }
};

export default Object.assign(execute, { runEvery: staleSeriesDuration * 1000 });

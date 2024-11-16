const fn = async ({ load }) => {
  const winners = await load.tx
    .select('id')
    .from('players')
    .orderBy('points', 'desc')
    .limit(3);

  await load.tx.table('players').update({ elo: 1000, points: 0 });
};

export default Object.assign(fn, { doEvery: 60 * 60 * 1000 * 24 * 60 });

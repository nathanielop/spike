const interval = 1000 * 60 * 15;

const fn = async ({ load }) =>
  await load.tx
    .delete()
    .from('pendingPlayers')
    .where('createdAt', '<', new Date(Date.now() - interval));

export default Object.assign(fn, { runEvery: 1000 * 60 });

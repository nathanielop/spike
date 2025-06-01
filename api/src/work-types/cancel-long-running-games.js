import pave from 'pave';

import schema from '#src/schema/index.js';

// Cancel games older than 1 hour
const fn = async ({ load }) => {
  const longRunningGames = await load.tx
    .select('id')
    .from('games')
    .whereNull('completedAt')
    .where('createdAt', '<', new Date(Date.now() - 1000 * 60 * 60));

  for (const { id } of longRunningGames) {
    await pave.execute({
      query: { deleteGame: { $: { id } } },
      context: { load, player: { isAdmin: true } },
      schema,
      type: 'root'
    });
  }
};

export default Object.assign(fn, { runEvery: 1000 * 60 * 60 });

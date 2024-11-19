import pave from 'pave';

import db from '#src/constants/db.js';
import createLoad from '#src/functions/create-load.js';
import schema from '#src/schema/index.js';

// Cancel games older than 1 hour
export default async () => {
  const longRunningGames = await db
    .select('id')
    .from('games')
    .whereNull('completedAt')
    .where('createdAt', '<', new Date(Date.now() - 1000 * 60 * 60));

  for (const { id } of longRunningGames) {
    await pave.execute({
      query: { deleteGame: { $: { id } } },
      context: { load: createLoad(), player: { isAdmin: true } },
      schema,
      type: 'root'
    });
  }
};

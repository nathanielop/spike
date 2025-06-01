import createLoad from '#src/functions/create-load.js';
import createWork from '#src/functions/create-work.js';

export default {
  up: async tx => {
    const load = createLoad({ tx });
    for (const type of ['benchInactivePlayers', 'cancelLongRunningGames']) {
      await createWork({ type, load });
    }
  },
  down: () => {}
};

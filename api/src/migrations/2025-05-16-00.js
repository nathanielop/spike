import createLoad from '#src/functions/create-load.js';
import createWork from '#src/functions/create-work.js';

export default {
  up: async tx => {
    const load = createLoad({ tx });
    await createWork({ type: 'rollSeason', load });
  },
  down: () => {}
};

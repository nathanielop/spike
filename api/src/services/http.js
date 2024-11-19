import { promisify } from 'node:util';

import server from '#src/constants/server.js';
import workers from '#src/workers/index.js';

const { console, setInterval } = globalThis;

export default {
  dependsOn: ['db'],
  start: async () => {
    await promisify(server.listen.bind(server, 80))();
    console.log('HTTP Started');
    for (const worker of Object.values(workers)) {
      if (!worker.runEvery) continue;

      setInterval(() => {
        try {
          worker();
        } catch (er) {
          console.error(er);
        }
      }, worker.runEvery);
    }
  },
  stop: async () => {
    await promisify(server.close.bind(server))();
    console.log('HTTP Stopped');
  }
};

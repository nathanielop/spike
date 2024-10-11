import { promisify } from 'node:util';

import server from '#src/constants/server.js';

const { console } = globalThis;

export default {
  dependsOn: ['db'],
  start: async () => {
    await promisify(server.listen.bind(server, 80))();
    console.log('HTTP Started');
  },
  stop: async () => {
    await promisify(server.close.bind(server))();
    console.log('HTTP Stopped');
  }
};

import janitorTypes from '#src/janitor-types/index.js';

const { console, setTimeout } = globalThis;

// Run every 5 minutes
const interval = 5 * 60 * 1000;

let timeout;

const clean = async () => {
  for (const cleanFn of Object.values(janitorTypes)) {
    try {
      await cleanFn();
    } catch (er) {
      console.log(er);
    }
  }
  timeout = setTimeout(clean, interval);
};

export default {
  dependsOn: ['db'],
  start: async () => {
    timeout = clean();
    console.log('Janitor Started');
  },
  stop: async () => {
    clearTimeout(timeout);
    console.log('Janitor Stopped');
  }
};

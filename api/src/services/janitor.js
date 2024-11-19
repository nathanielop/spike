import janitorTypes from '#src/janitor-types/index.js';

const { console, setTimeout } = globalThis;

// Run every 5 minutes
const interval = 5 * 60 * 1000;

let shouldClean = true;

const clean = async () => {
  if (!shouldClean) return;
  for (const cleanFn of Object.values(janitorTypes)) {
    try {
      await cleanFn();
    } catch (er) {
      console.log(er);
    }
  }
  setTimeout(clean, interval);
};

export default {
  dependsOn: ['db'],
  start: async () => {
    console.log('[janitor] starting...');
    clean();
    console.log('[janitor] started');
  },
  stop: async () => {
    console.log('[janitor] stopping...');
    shouldClean = false;
    console.log('[janitor] stopped');
  }
};

import db from '#src/constants/db.js';
import createLoad from '#src/functions/create-load.js';
import workTypes from '#src/work-types/index.js';

const { console, setTimeout } = globalThis;

const interval = 60 * 1000;

let shouldProcessWork = true;

const doWork = async () => {
  if (!shouldProcessWork) return;
  const workTodo = await db.select().from('work');
  if (workTodo && workTodo.length) {
    for (const work of workTodo) {
      const { id, type, data, startAt } = work;
      if (startAt && startAt > new Date()) continue;

      const fn = workTypes[type];
      if (!fn) continue;

      try {
        await db.transaction(async tx => {
          const load = createLoad({ tx });

          await fn({ ...data, load });

          if (fn.doEvery) {
            const { doEvery } = fn;
            await db
              .update({ startAt: new Date(Date.now() + doEvery) })
              .from('work')
              .where({ id });
          } else {
            await db.delete('*').from('work').where({ id });
          }
        });
      } catch (er) {
        console.log(er);
      }
    }
  }
  setTimeout(doWork, interval);
};

export default {
  dependsOn: ['db'],
  start: async () => {
    console.log('[work-processor] starting...');
    doWork();
    console.log('[work-processor] started');
  },
  stop: async () => {
    console.log('[work-processor] stopping...');
    shouldProcessWork = false;
    console.log('[work-processor] stopped');
  }
};

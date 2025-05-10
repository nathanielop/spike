import db from '#src/constants/db.js';
import createLoad from '#src/functions/create-load.js';
import workTypes from '#src/work-types/index.js';

const { console, setTimeout, clearTimeout } = globalThis;

// Run every minute
const interval = 1 * 60 * 1000;

let timeout;

const processWork = async () => {
  const work = await db.select().from('work');
  for (const { id, type, data, runAt } of work) {
    try {
      if (runAt && runAt > new Date()) continue;

      const load = createLoad();
      await load.tx.transaction(async tx => {
        const workType = workTypes[type];
        await workType({ data, load: createLoad({ tx }) });
        if (workType.runEvery) {
          await tx
            .table('work')
            .update({ runAt: new Date(Date.now() + workType.runEvery) })
            .where({ id });
        } else await tx.delete().from('work').where({ id });
      });
    } catch (er) {
      console.log(er);
    }
  }

  timeout = setTimeout(processWork, interval);
};

export default {
  dependsOn: ['db'],
  start: async () => {
    timeout = processWork();
    console.log('Work Started');
  },
  stop: async () => {
    clearTimeout(timeout);
    console.log('Work Stopped');
  }
};

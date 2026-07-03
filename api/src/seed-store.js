import createLoad from '#src/functions/create-load.js';
import seedStore from '#src/functions/seed-store.js';
import services from '#src/services/index.js';

const { console, process } = globalThis;

await services.start('db');

const load = createLoad();
const count = await seedStore(load);

console.log(
  `Seeded ${count} new item${count !== 1 ? 's' : ''} into the store.`
);

await services.stop();

process.exit(0);

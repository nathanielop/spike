import migrate from '#src/functions/migrate.js';
import services from '#src/services/index.js';

await services.start('db');
await migrate();
await services.stop();

process.exit(0);

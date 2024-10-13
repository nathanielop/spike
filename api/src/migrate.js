import migrate from '#src/functions/migrate.js';
import services from '#src/services/index.js';

services
  .start('db')
  .then(migrate)
  .then(() => services.stop());

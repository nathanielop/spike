import { readdir } from 'node:fs/promises';

import db from '#src/constants/db.js';

export default () =>
  db.migrate.latest({
    migrationSource: {
      getMigrations: async () =>
        await Promise.all(
          (await readdir('src/migrations'))
            .sort()
            .filter(fileName => fileName.endsWith('.js'))
            .map(async fileName => ({
              down: async () => {
                throw new Error('Irreversible migration');
              },
              ...(await import(`#src/migrations/${fileName}`)).default,
              fileName
            }))
        ),
      getMigrationName: migration => migration.fileName,
      getMigration: migration => migration
    }
  });

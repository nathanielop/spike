import createDbType from '#src/functions/create-db-type.js';
import avatarUrl from '#src/schema/player/avatar-url.js';
import streaks from '#src/schema/player/streaks.js';

export default createDbType({
  table: 'players',
  local: {
    id: 'id',
    name: 'string'
  },
  fields: {
    avatarUrl,
    streaks
  }
});
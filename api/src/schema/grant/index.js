import createDbType from '#src/functions/create-db-type.js';

export default createDbType({
  table: 'grants',
  local: {
    secret: { type: 'string' }
  },
  references: {
    player: { type: 'player' }
  }
});

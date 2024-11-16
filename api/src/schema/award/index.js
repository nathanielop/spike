import createDbType from '#src/functions/create-db-type.js';

export default createDbType({
  table: 'awards',
  local: {
    name: 'string',
    description: { nullable: 'string' }
  },
  references: {
    player: 'player'
  }
});

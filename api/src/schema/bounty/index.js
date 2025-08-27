import createDbType from '#src/functions/create-db-type.js';

export default createDbType({
  table: 'bounties',
  local: {
    amount: 'integer',
    isClaimed: 'boolean'
  },
  references: {
    placedByPlayer: 'player',
    placedOnPlayer: 'player'
  }
});

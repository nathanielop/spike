import createDbType from '#src/functions/create-db-type.js';

export default createDbType({
  table: 'bets',
  local: {
    amount: 'integer',
    isActive: 'boolean',
    paidOutAmount: { nullable: 'integer' },
    payRate: 'number'
  },
  references: {
    player: 'player'
  }
  // TODO Add series/team references/fields
});

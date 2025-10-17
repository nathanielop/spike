export default {
  up: async tx =>
    await tx.schema.table('bets', t => {
      t.bigint('amount').notNullable().alter();
      t.bigint('paidOutAmount').notNullable().alter();
    }),
  down: async tx =>
    await tx.schema.table('bets', t => {
      t.integer('amount').notNullable().alter();
      t.integer('paidOutAmount').notNullable().alter();
    })
};

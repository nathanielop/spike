export default {
  up: async tx =>
    await tx.schema.table('bounties', t => {
      t.bigint('amount').notNullable().alter();
    }),
  down: async tx =>
    await tx.schema.table('bounties', t => {
      t.integer('amount').notNullable().alter();
    })
};

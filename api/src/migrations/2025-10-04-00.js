export default {
  up: async tx =>
    await tx.schema.table('players', t => {
      t.bigint('credits').notNullable().alter();
    }),
  down: async tx =>
    await tx.schema.table('players', t => {
      t.integer('credits').notNullable().alter();
    })
};

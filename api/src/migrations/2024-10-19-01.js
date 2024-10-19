export default {
  up: async tx =>
    await tx.schema.table('players', t => {
      t.integer('points').notNullable().defaultTo(0);
    }),
  down: async tx =>
    await tx.schema.table('players', t => {
      t.dropColumn('points');
    })
};

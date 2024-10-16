export default {
  up: async tx =>
    await tx.schema.table('players', t => {
      t.integer('elo').notNullable().defaultTo(1000);
      t.integer('credits').notNullable().defaultTo(1000);
    }),
  down: async tx =>
    await tx.schema.table('players', t => {
      t.dropColumn('elo');
      t.dropColumn('credits');
    })
};

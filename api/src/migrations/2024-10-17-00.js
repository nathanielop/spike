export default {
  up: async tx =>
    await tx.schema.table('series', t => {
      t.integer('season').notNullable().defaultTo(0);
    }),
  down: async tx =>
    await tx.schema.table('series', t => {
      t.dropColumn('season');
    })
};

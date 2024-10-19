export default {
  up: async tx =>
    await tx.schema.table('series', t => {
      t.integer('season').notNullable().alter();
    }),
  down: async tx =>
    await tx.schema.table('series', t => {
      t.integer('season').notNullable().defaultTo(0).alter();
    })
};

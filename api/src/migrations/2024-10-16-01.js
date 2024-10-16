export default {
  up: async tx =>
    await tx.schema.table('series', t => {
      t.integer('bestOf').notNullable().alter();
    }),
  down: async tx =>
    await tx.schema.table('series', t => {
      t.integer('bestOf').notNullable().defaultTo(3).alter();
    })
};

export default {
  up: async tx =>
    await tx.schema.table('series', t => {
      t.dropColumn('format');
      t.integer('bestOf').notNullable().defaultTo(3);
    }),
  down: async tx =>
    await tx.schema.table('series', t => {
      t.dropColumn('bestOf');
      t.specificType('format', 'citext').notNullable();
    })
};

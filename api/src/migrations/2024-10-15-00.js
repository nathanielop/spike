export default {
  up: async tx =>
    await tx.schema.table('series', t => {
      t.datetime('completedAt');
    }),
  down: async tx =>
    await tx.schema.table('series', t => {
      t.dropColumn('completedAt');
    })
};

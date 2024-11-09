export default {
  up: async tx =>
    await tx.schema.table('players', t => {
      t.boolean('isSuperAdmin').notNullable().defaultTo(false);
    }),
  down: async tx =>
    await tx.schema.table('players', t => {
      t.dropColumn('isSuperAdmin');
    })
};

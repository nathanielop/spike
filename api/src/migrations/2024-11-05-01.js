export default {
  up: async tx =>
    await tx.schema.table('players', t => {
      t.boolean('isSuperAdmin').notNullable().alter();
    }),
  down: async tx =>
    await tx.schema.table('players', t => {
      t.boolean('isSuperAdmin').notNullable().defaultTo(false).alter();
    })
};

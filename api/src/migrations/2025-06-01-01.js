export default {
  up: async tx => {
    await tx.schema.table('pendingPlayers', t => {
      t.integer('team');
    });
  },
  down: async tx => {
    await tx.schema.table('pendingPlayers', t => {
      t.dropColumn('team');
    });
  }
};

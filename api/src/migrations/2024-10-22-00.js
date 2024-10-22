export default {
  up: async tx =>
    await tx.schema.table('players', t => {
      t.datetime('dailyRewardLastClaimedAt');
    }),
  down: async tx =>
    await tx.schema.table('players', t => {
      t.dropColumn('dailyRewardLastClaimedAt');
    })
};

export default {
  type: { arrayOf: 'bounty' },
  resolve: async ({ context: { load }, object: { id } }) =>
    await load.tx
      .select()
      .from('bounties')
      .where({ placedOnPlayerId: id, isClaimed: false })
      .orderBy('createdAt', 'desc')
      .limit(10)
};

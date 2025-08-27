export default {
  type: { arrayOf: 'bounty' },
  resolve: async ({ context: { load, player }, object: { id } }) => {
    if (player.id !== id) return [];

    return await load.tx
      .select()
      .from('bounties')
      .where({ placedByPlayerId: id })
      .orderBy('createdAt', 'desc')
      .limit(10);
  }
};

export default {
  type: { arrayOf: 'bet' },
  resolve: async ({ context: { load, player }, object: { id } }) => {
    if (player.id !== id) return [];

    return await load.tx
      .select()
      .from('bets')
      .where({ playerId: id })
      .orderBy('createdAt', 'desc')
      .limit(10);
  }
};

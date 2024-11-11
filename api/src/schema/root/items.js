export default {
  type: { arrayOf: 'item' },
  resolve: async ({ context: { load, player } }) => {
    const query = load.tx.select().from('items');
    if (!player?.isSuperAdmin) query.where({ isForSale: true });
    return await query;
  }
};

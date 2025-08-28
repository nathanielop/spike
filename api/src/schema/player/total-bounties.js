export default {
  type: 'integer',
  resolve: async ({ context: { load }, object: { id } }) => {
    const [{ total = 0 }] = await load.tx
      .select('sum(amount) as total')
      .from('bounties')
      .where({ placedOnPlayerId: id, isClaimed: false });
    return total;
  }
};

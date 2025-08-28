export default {
  type: 'integer',
  resolve: async ({ context: { load }, object: { id } }) => {
    const [{ sum = 0 }] = await load.tx
      .sum('amount')
      .from('bounties')
      .where({ placedOnPlayerId: id, isClaimed: false });
    return sum;
  }
};

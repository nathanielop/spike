export default {
  type: { arrayOf: 'item' },
  resolve: async ({ context: { load } }) =>
    await load.tx.select().from('items').where({ isForSale: true })
};

export default {
  type: { arrayOf: 'player' },
  resolve: async ({ context: { load } }) =>
    await load.tx.select().from('players')
};

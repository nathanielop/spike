export default {
  type: { arrayOf: 'award' },
  resolve: async ({ context: { load }, object: { id } }) =>
    await load.tx
      .select()
      .from('awards')
      .where({ playerId: id })
      .orderBy('createdAt', 'desc')
};

export default {
  type: { arrayOf: 'game' },
  resolve: async ({ context: { load }, object: { id } }) =>
    await load.tx.select().from('games').where({ seriesId: id })
};

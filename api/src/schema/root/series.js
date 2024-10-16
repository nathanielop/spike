export default {
  type: { nullable: 'series' },
  input: {
    object: {
      id: 'id'
    }
  },
  resolve: async ({ input: { id }, context: { load } }) =>
    await load('series', id)
};

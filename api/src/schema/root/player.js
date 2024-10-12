export default {
  type: { nullable: 'player' },
  input: {
    object: {
      id: 'id'
    }
  },
  resolve: async ({ input: { id }, context: { load } }) =>
    await load('players', id)
};

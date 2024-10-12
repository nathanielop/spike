import PublicError from '#src/constants/public-error.js';

export default {
  type: 'root',
  input: {
    object: {
      id: 'id'
    }
  },
  resolve: async ({ input: { id }, context: { load, grant } }) => {
    if (!grant || grant.id !== id) {
      throw new PublicError('You do not have permission to delete this grant');
    }

    await load.tx.delete().from('grants').where({ id });
  }
};

import createEnumType from '#src/functions/create-enum-type.js';

export default {
  type: { arrayOf: 'player' },
  input: {
    object: {
      sortBy: {
        nullable: {
          object: {
            field: createEnumType(['createdAt', 'elo', 'points']),
            order: {
              type: createEnumType(['asc', 'desc']),
              defaultValue: 'desc'
            }
          }
        }
      },
      size: {
        type: 'integer',
        typeArgs: { min: 1, max: 100 },
        defaultValue: 10
      }
    }
  },
  resolve: async ({ input: { size, sortBy }, context: { load } }) => {
    const query = load.tx
      .select()
      .from('players')
      .where({ isActive: true })
      .limit(size);

    if (sortBy) query.orderBy(sortBy.field, sortBy.order);

    return await query;
  }
};

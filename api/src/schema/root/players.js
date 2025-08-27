import createEnumType from '#src/functions/create-enum-type.js';

export default {
  type: { arrayOf: 'player' },
  input: {
    object: {
      activeOnly: { type: 'boolean', defaultValue: true },
      sortBy: {
        nullable: {
          object: {
            field: createEnumType(['createdAt', 'elo', 'points', 'credits']),
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
  resolve: async ({
    input: { activeOnly, size, sortBy },
    context: { load }
  }) => {
    const query = load.tx.select().from('players').limit(size);

    if (activeOnly) query.where('isActive', true);

    if (sortBy) query.orderBy(sortBy.field, sortBy.order);

    return await query;
  }
};

import PublicError from '#src/constants/public-error.js';
import createId from '#src/functions/create-id.js';

export default {
  type: 'root',
  input: {
    object: {
      attributes: {},
      description: { nullable: 'string' },
      discountedPrice: { nullable: { type: 'integer', typeArgs: { min: 0 } } },
      isForSale: { type: 'boolean', defaultValue: true },
      limitedTo: { nullable: { type: 'integer', typeArgs: { min: 0 } } },
      name: 'string',
      price: { type: 'integer', typeArgs: { min: 0 } },
      type: 'itemType'
    }
  },
  resolve: async ({
    context: { load, player },
    input: {
      attributes,
      description,
      discountedPrice,
      isForSale,
      limitedTo,
      name,
      price,
      type
    }
  }) => {
    if (!player?.isSuperAdmin) {
      throw new PublicError(
        'You do not have permission to create a new store item'
      );
    }

    const id = createId();
    await load.tx
      .insert({
        id: createId(),
        attributes,
        description,
        discountedPrice,
        isForSale,
        limitedTo,
        name,
        price,
        type,
        createdAt: new Date()
      })
      .into('items');

    return { createdItem: { id } };
  }
};

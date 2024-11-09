import PublicError from '#src/constants/public-error.js';
import maybeUpdate from '#src/functions/maybe-update.js';

export default {
  type: 'root',
  input: {
    object: {
      attributes: { optional: {} },
      description: { optional: { nullable: 'string' } },
      discountedPrice: {
        optional: { nullable: { type: 'integer', typeArgs: { min: 0 } } }
      },
      isForSale: { optional: 'boolean' },
      id: 'id',
      limitedTo: {
        optional: { nullable: { type: 'integer', typeArgs: { min: 0 } } }
      },
      name: { optional: 'string' },
      price: { optional: { type: 'integer', typeArgs: { min: 0 } } },
      type: { optional: 'itemType' }
    }
  },
  resolve: async ({
    input: {
      attributes,
      description,
      discountedPrice,
      isForSale,
      id,
      limitedTo,
      name,
      price,
      type
    },
    context: { load, player }
  }) => {
    if (!player?.isSuperAdmin) {
      throw new PublicError(
        'You do not have permission to create a new store item'
      );
    }

    const item = await load('items', id);
    if (!item) {
      throw new PublicError('Item not found');
    }

    const update = {};
    maybeUpdate(update, item, {
      description,
      discountedPrice,
      isForSale,
      limitedTo,
      name,
      price,
      type
    });

    if (attributes) update.attributes = attributes;

    if (!Object.keys(update).length) return;

    await load.tx.table('items').update(update).where({ id });
  }
};

import PublicError from '#src/constants/public-error.js';
import createId from '#src/functions/create-id.js';

export default {
  type: 'root',
  input: {
    object: {
      itemId: 'id'
    }
  },
  resolve: async ({ context: { load, player }, input: { itemId } }) => {
    const item = await load('items', itemId);
    if (!item || !player) {
      throw new PublicError('You do not have permission to purchase this item');
    }

    const alreadyPurchased = await load.tx
      .first()
      .from('itemPurchases')
      .where({ playerId: player.id, itemId });
    if (alreadyPurchased) {
      throw new PublicError('You have already purchased this item');
    }

    const [{ count: purchaseCount }] = await load.tx
      .count()
      .from('itemPurchases')
      .where({ itemId });
    if (
      !item.isForSale ||
      (item.limitedTo && purchaseCount === item.limitedTo)
    ) {
      throw new PublicError('This item is not for sale');
    }

    const itemPrice = item.discountedPrice ?? item.price;
    if (itemPrice > player.credits) {
      throw new PublicError(
        'You do not have enough credits to purchase this item'
      );
    }

    await load.tx.transaction(async tx => {
      await tx
        .insert({
          id: createId(),
          isEquipped: false,
          playerId: player.id,
          itemId,
          createdAt: new Date()
        })
        .into('itemPurchases');

      if (item.limitedTo && purchaseCount + 1 === item.limitedTo) {
        await tx
          .table('items')
          .update({ isForSale: false })
          .where({ id: itemId });
      }

      await tx
        .table('players')
        .update({ credits: player.credits - itemPrice })
        .where({ id: player.id });
    });
  }
};

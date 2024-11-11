export default {
  type: {
    arrayOf: {
      object: {
        item: 'item',
        isEquipped: 'boolean'
      }
    }
  },
  resolve: async ({ context: { load, player }, object: { id } }) => {
    const query = load.tx
      .select('itemPurchases.itemId', 'itemPurchases.isEquipped')
      .from('itemPurchases')
      .where({ playerId: id });

    if (player?.id !== id) query.where({ isEquipped: true });

    const purchasedItems = await query;

    return purchasedItems.map(({ itemId, isEquipped }) => ({
      item: { id: itemId },
      isEquipped
    }));
  }
};

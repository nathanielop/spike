export default {
  type: {
    arrayOf: {
      object: {
        item: 'item',
        isEquipped: 'boolean'
      }
    }
  },
  resolve: async ({ context: { load }, object: { id } }) => {
    const purchasedItems = await load.tx
      .select('itemPurchases.itemId', 'itemPurchases.isEquipped')
      .from('itemPurchases')
      .where({ playerId: id });

    return purchasedItems.map(({ itemId, isEquipped }) => ({
      item: { id: itemId },
      isEquipped
    }));
  }
};

import createId from '#src/functions/create-id.js';

const travisId = 'WvuTVJOjMLqv';

const remainder = 15000000;

export default {
  up: async tx => {
    const travis = await tx.first().from('players').where({ id: travisId });
    if (!travis) return;

    const itemId = createId();
    await tx
      .insert({
        id: itemId,
        attributes: { children: '👑' },
        limitedTo: 1,
        description:
          'Congratulations, you broke the economy and required loopholes to be fixed to prevent it from happening again. You are the first person to break the economy, and you have been awarded this badge as a token of your achievement.',
        isForSale: false,
        name: 'I Broke The Economy',
        price: travis.credits - remainder,
        type: 'badge',
        createdAt: new Date()
      })
      .into('items');

    await tx
      .insert({
        id: createId(),
        isEquipped: false,
        playerId: travisId,
        itemId,
        createdAt: new Date()
      })
      .into('itemPurchases');

    await tx
      .table('players')
      .update({ credits: remainder })
      .where({ id: travisId });
  },
  down: () => {}
};

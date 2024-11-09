import bcrypt from 'bcrypt';

import PublicError from '#src/constants/public-error.js';
import maybeUpdate from '#src/functions/maybe-update.js';
import unique from '#src/functions/unique.js';

export default {
  type: 'root',
  input: {
    object: {
      equippedItemIds: { optional: { arrayOf: 'id' } },
      id: 'id',
      nickname: { optional: { nullable: 'string' } },
      name: { optional: { nullable: 'string' } },
      password: { optional: { nullable: 'string' } }
    }
  },
  resolve: async ({
    input: { equippedItemIds, id, nickname, name, password },
    context,
    context: { load }
  }) => {
    const player = await load('players', id);
    if (!player || context.player?.id !== player.id) {
      throw new PublicError("You don't have permission to update this player");
    }

    if (equippedItemIds) {
      const items = await load.tx
        .select('items.*')
        .from('items')
        .whereIn('id', equippedItemIds)
        .whereExists(query =>
          query
            .select()
            .from('itemPurchases')
            .whereColumn('itemId', 'items.id')
            .where({ playerId: id })
        );
      if (items.length !== equippedItemIds.length) {
        throw new PublicError(
          'Equipped items either do not exist or have not been purchased'
        );
      }

      if (unique(items, 'type').length !== items.length) {
        throw new PublicError('Equipped items must be unique per type');
      }
    }

    const update = {};
    maybeUpdate(update, player, { nickname, name });

    if (password && !(await bcrypt.compare(password, player.passwordHash))) {
      update.passwordHash = await bcrypt.hash(password, 10);
    }

    if (!Object.keys(update).length && !equippedItemIds) return;

    await load.tx.transaction(async tx => {
      if (Object.keys(update).length) {
        await tx.table('players').update(update).where({ id });
      }

      if (equippedItemIds) {
        const itemPurchases = await tx
          .select()
          .from('itemPurchases')
          .where({ playerId: id });

        const values = itemPurchases.map(itemPurchase => [
          itemPurchase.id,
          equippedItemIds.includes(itemPurchase.itemId)
        ]);

        await tx.raw(
          `
            update "itemPurchases"
            set "isEquipped" = data."isEquipped"::boolean
            from (values ${Array.from(values, () => '(?, ?)').join(
              ', '
            )}) as data (id, "isEquipped")
            where "itemPurchases".id = data.id
            `,
          values.flat()
        );
      }
    });
  }
};

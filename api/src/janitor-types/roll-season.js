import { DateTime } from 'luxon';

import db from '#src/constants/db.js';
import createId from '#src/functions/create-id.js';
import createLoad from '#src/functions/create-load.js';
import getCurrentSeason from '#src/functions/get-current-season.js';

export default async () => {
  const load = createLoad();
  const currentSeason = await getCurrentSeason(load);
  if (DateTime.now() < DateTime.fromISO(currentSeason.endsAt)) return;

  await db.transaction(async tx => {
    const winnerIds = await tx
      .pluck('id')
      .from('players')
      .limit(3)
      .orderBy('points', 'desc');

    const itemIds = Array.from({ length: 3 }, () => createId());
    await tx
      .insert(
        itemIds.map((id, i) => ({
          id,
          attributes: { children: i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉' },
          isForSale: false,
          name: `JTSpike Season ${currentSeason.season} ${i === 0 ? 'Winner' : i === 1 ? '2nd Place' : '3rd Place'}`,
          price: 0,
          type: 'badge',
          createdAt: new Date()
        }))
      )
      .into('items');

    await tx
      .insert(
        winnerIds.map((playerId, i) => ({
          id: createId(),
          isEquipped: false,
          playerId,
          itemId: itemIds[i],
          createdAt: new Date()
        }))
      )
      .into('itemPurchases');

    await tx.table('players').update({ points: 0 });

    await tx
      .table('seasons')
      .update({
        endedAt: new Date(),
        endsAt: null,
        firstPlacePlayerId: winnerIds[0],
        secondPlacePlayerId: winnerIds[1],
        thirdPlacePlayerId: winnerIds[2]
      })
      .where({ id: currentSeason.id });

    await tx
      .insert({
        id: createId(),
        season: currentSeason.season + 1,
        createdAt: new Date(),
        endsAt: DateTime.now().plus({ months: 3 }).toISO()
      })
      .into('seasons');
  });
};

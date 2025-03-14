import { DateTime } from 'luxon';

import db from '#src/constants/db.js';
import createId from '#src/functions/create-id.js';
import createLoad from '#src/functions/create-load.js';
import getCurrentSeason from '#src/functions/get-current-season.js';

const places = [
  { badge: '🥇', name: 'Winner', prize: 2500 },
  { badge: '🥈', name: '2nd Place', prize: 1000 },
  { badge: '🥉', name: '3rd Place', prize: 500 }
];

export default async () => {
  const load = createLoad();
  const currentSeason = await getCurrentSeason(load);
  if (DateTime.now() > DateTime.fromISO(currentSeason.endsAt)) return;

  await db.transaction(async tx => {
    const winners = await tx
      .select()
      .from('players')
      .limit(places.length)
      .orderBy('points', 'desc');

    const items = places.map(place => ({ id: createId(), ...place }));
    await tx
      .insert(
        items.map(({ id, badge, name }) => ({
          id,
          attributes: { children: badge },
          isForSale: false,
          name: `JTSpike Season ${currentSeason.season} ${name}`,
          price: 0,
          type: 'badge',
          createdAt: new Date()
        }))
      )
      .into('items');

    await tx
      .insert(
        winners.map(({ id: playerId }, i) => ({
          id: createId(),
          isEquipped: false,
          playerId,
          itemId: items[i].id,
          createdAt: new Date()
        }))
      )
      .into('itemPurchases');

    await tx.table('players').update({ points: 0 });

    await tx
      .insert(
        winners.map((player, i) => ({
          ...player,
          credits: player.credits + places[i].prize
        }))
      )
      .into('players')
      .onConflict('id')
      .merge();

    await tx
      .table('seasons')
      .update({
        endedAt: new Date(),
        endsAt: null,
        firstPlacePlayerId: winners[0].id,
        secondPlacePlayerId: winners[1].id,
        thirdPlacePlayerId: winners[2].id
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

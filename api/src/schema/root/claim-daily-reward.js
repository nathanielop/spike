import { DateTime } from 'luxon';

import dailyRewardRanges from '#src/constants/daily-reward-ranges.js';
import PublicError from '#src/constants/public-error.js';

const zone = 'America/Chicago';

export default {
  type: 'integer',
  resolve: async ({ context: { load, player } }) => {
    if (!player) {
      throw new PublicError('You must be logged in to claim your daily reward');
    }

    if (
      player.dailyRewardLastClaimedAt >
      DateTime.now().setZone(zone).minus({ days: 1 }).startOf('day').toISO()
    ) {
      throw new PublicError('You have already claimed your daily reward');
    }

    const { credits } = await load('players', player.id);
    const result = Math.random();
    const reward = Number(
      Object.keys(dailyRewardRanges).find(
        k =>
          result >= dailyRewardRanges[k][0] && result < dailyRewardRanges[k][1]
      )
    );

    await load.tx
      .table('players')
      .update({
        credits: credits + reward,
        dailyRewardLastClaimedAt: DateTime.now()
          .setZone(zone)
          .startOf('day')
          .toISO()
      })
      .where({ id: player.id });

    return reward;
  }
};

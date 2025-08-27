import PublicError from '#src/constants/public-error.js';
import createId from '#src/functions/create-id.js';

export default {
  type: 'root',
  input: {
    object: {
      amount: { type: 'integer', typeArgs: { min: 1 } },
      playerId: 'id'
    }
  },
  resolve: async ({
    context: { load, player },
    input: { amount, playerId }
  }) => {
    if (!player) {
      throw new PublicError('You do not have permission to place a bounty');
    }

    if (amount > player.credits) {
      throw new PublicError(
        'You do not have enough credits to place this bounty'
      );
    }

    const id = createId();
    await load.tx.transaction(async tx => {
      await tx
        .insert({
          id,
          amount,
          isClaimed: false,
          placedByPlayerId: player.id,
          placedOnPlayerId: playerId,
          createdAt: new Date()
        })
        .into('bounties');

      await tx
        .table('players')
        .update({ credits: player.credits - amount })
        .where({ id: player.id });
    });

    return { createdBounty: { id } };
  }
};

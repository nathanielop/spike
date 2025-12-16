import PublicError from '#src/constants/public-error.js';
import createId from '#src/functions/create-id.js';
import postToSlack from '#src/functions/post-to-slack.js';

const { console, Intl } = globalThis;

const formatter = Intl.NumberFormat('en-US');

export default {
  type: 'root',
  input: {
    object: {
      amount: { type: 'integer', typeInput: { min: 1 } },
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

    const onPlayer = await load('players', playerId);
    if (!onPlayer) {
      throw new PublicError(
        'The player you are placing a bounty on is invalid'
      );
    }

    if (onPlayer.id === player.id) {
      throw new PublicError('You cannot place a bounty on yourself');
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

    try {
      await postToSlack({
        subject: `🎯 ${player.name} placed a ${formatter.format(amount)} credit bounty on ${onPlayer.name}!`,
        title: `*BOUNTY PLACED 🎯*`
      });
    } catch (er) {
      console.log('Error sending slack message', er);
    }

    return { createdBounty: { id } };
  }
};

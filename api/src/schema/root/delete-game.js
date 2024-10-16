import PublicError from '#src/constants/public-error.js';

export default {
  type: 'root',
  input: {
    object: {
      id: 'id'
    }
  },
  resolve: async ({ input: { id }, context: { load, player } }) => {
    const game = await load('games', id);
    if (!game || !player?.isAdmin) {
      throw new PublicError("You don't have permission to delete this game");
    }

    if (game.completedAt) {
      throw new PublicError('You cannot delete a completed game');
    }

    await load.tx.transaction(async tx => {
      await tx.table('games').update({ completedAt: new Date() }).where({ id });

      await tx
        .table('series')
        .update({ completedAt: new Date() })
        .where({ id: game.seriesId });
    });
  }
};

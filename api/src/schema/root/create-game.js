import PublicError from '#src/constants/public-error.js';
import createId from '#src/functions/create-id.js';

export default {
  type: 'root',
  input: {
    object: {
      seriesId: 'id'
    }
  },
  resolve: async ({ context: { load, player }, input: { seriesId } }) => {
    const series = await load('series', seriesId);
    if (!series || !player?.isAdmin) {
      throw new PublicError(
        'You do not have permission to create a new game for this series'
      );
    }

    const [{ count }] = await load.tx
      .count()
      .from('games')
      .where({ seriesId })
      .whereNotNull('completedAt');
    if (series.isCompleted || series.bestOf === count) {
      throw new PublicError('This series has already been completed');
    }

    const inProgress = await load.tx
      .first()
      .from('games')
      .where({ seriesId })
      .whereNull('completedAt');
    if (inProgress) {
      throw new PublicError(
        'There is already a game in progress for this series'
      );
    }

    const id = createId();
    await load.tx.insert({ id, seriesId, createdAt: new Date() }).into('games');

    return { createdGame: { id } };
  }
};

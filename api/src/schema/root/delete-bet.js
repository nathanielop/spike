import PublicError from '#src/constants/public-error.js';

const betTimeLimit = 1000 * 60 * 5;

export default {
  type: 'root',
  input: {
    object: {
      id: 'id'
    }
  },
  resolve: async ({ input: { id }, context: { load, player } }) => {
    const bet = await load('bets', id);
    if (!bet || player?.id !== bet.playerId) {
      throw new PublicError('You do not have permission to delete this bet');
    }

    const [series] = await load.tx
      .select('series.*')
      .from('seriesTeams')
      .join('series', 'series.id', 'seriesTeams.seriesId')
      .where({ 'seriesTeams.id': bet.seriesTeamId });
    if (series.completedAt || series.createdAt < Date.now() - betTimeLimit) {
      throw new PublicError('Betting is closed for this series');
    }

    await load.tx.delete().from('bets').where({ id });
  }
};

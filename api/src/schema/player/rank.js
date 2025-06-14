import getPlayerRank from '#src/functions/get-player-rank.js';

export default {
  type: { nullable: 'rank' },
  resolve: async ({ context: { load }, object: { id } }) =>
    await getPlayerRank({ load, playerId: id })
};

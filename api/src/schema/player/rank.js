import ranks from '#src/constants/ranks.js';

export default {
  type: 'rank',
  resolve: async ({ context: { load }, object: { id } }) => {
    const { elo } = await load('players', id);
    return Object.entries(ranks).find(
      ([, [min, max]]) => elo >= min && (!max || elo <= max)
    )[0];
  }
};

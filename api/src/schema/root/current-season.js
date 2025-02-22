import getCurrentSeason from '#src/functions/get-current-season.js';

export default {
  type: 'season',
  resolve: async ({ context: { load } }) => await getCurrentSeason(load)
};

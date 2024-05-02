import players from '#src/constants/players.ts';

export default {
  type: { arrayOf: 'player' },
  resolve: players
};

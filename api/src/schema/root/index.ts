import players from '#src/schema/root/players.ts';

export default {
  type: {
    object: {
      players
    },
    defaultValue: {}
  },
  defaultValue: {},
  resolve: async ({ value }) => value
};

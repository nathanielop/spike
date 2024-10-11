import players from '#src/schema/root/players.js';

export default {
  type: {
    object: {
      players
    },
    defaultValue: {}
  },
  defaultValue: {},
  resolve: ({ path, value, context: { load } }) => {
    // Clear load cache for nested queries
    // (necessary for processing updates & requerying loaded information)
    if (path.length > 0) load.clear();

    return value;
  }
};

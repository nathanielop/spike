import server from '#src/constants/server.ts';

export default {
  dependsOn: ['db'],
  stop: async () => await server.stop()
};

import services from '#src/services/index.js';

const { process } = globalThis;

process.on('SIGTERM', () => services.stop());
process.on('SIGINT', () => services.stop());

await services.start(['http', 'janitor']);

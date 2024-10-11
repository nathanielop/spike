import services from '#src/services/index.js';

const { process } = globalThis;

process.on('SIGTERM', () => services.stop());

await services.start('http');

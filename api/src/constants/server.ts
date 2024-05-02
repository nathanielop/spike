import Bun from 'bun';
import pave from 'pave';

import config from '#src/config.ts';
import schema from '#src/schema/index.ts';

const { version } = config;

export default Bun.serve({
  port: 80,
  fetch: async req => {
    const url = new URL(req.url);
    if (url.pathname === '/version') return new Response(version);
    if (url.pathname === '/pave' && req.method === 'POST') {
      let query;
      try {
        if (!req.body) {
          return new Response('A payload must be provided', { status: 400 });
        }
        const body = await req.json();
        query = JSON.parse(body);
        await pave.validateQuery({ query, schema, type: 'root' });
      } catch (er) {
        return new Response(er.message);
      }

      return new Response(await pave.execute({ query, schema, type: 'root' }));
    }
    return new Response('Not found', { status: 404 });
  }
});

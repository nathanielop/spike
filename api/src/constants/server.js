import http from 'http';

import pave from 'pave';

import config from '#src/config.js';
import createLoad from '#src/functions/create-load.js';
import schema from '#src/schema/index.js';

const { version } = config;

const maxPayload = 1024 * 1024;

export default http.createServer(async (request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');

  if (request.url === '/version') return response.end(version);

  if (request.url === '/pave' && request.method === 'POST') {
    let query;
    try {
      let body = '';
      request.on('data', chunk => (body += chunk));
      await new Promise(resolve => request.on('end', resolve));

      if (!body) {
        response.statusCode = 400;
        return response.end('A payload must be provided');
      } else if (body.length > maxPayload) {
        response.statusCode = 413;
        return response.end('Payload too large');
      }

      ({query} = JSON.parse(body));
      await pave.validateQuery({ query, schema, type: 'root' });
    } catch (er) {
      response.statusCode = 400;
      return response.end(er.message);
    }

    response.setHeader('Content-Type', 'application/json');
    response.statusCode = 200;
    return response.end(
      JSON.stringify(
        await pave.execute({
          query,
          context: { load: createLoad() },
          schema,
          type: 'root'
        })
      )
    );
  }

  response.statusCode = 404;
  response.end('Not found');
});

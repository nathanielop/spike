import http from 'http';

import pave from 'pave';
import { WebSocketServer } from 'ws';

import config from '#src/config.js';
import PublicError from '#src/constants/public-error.js';
import createLoad from '#src/functions/create-load.js';
import schema from '#src/schema/index.js';

const { console } = globalThis;

const { version } = config;

const maxPayload = 1024 * 1024;

const server = http.createServer(async (request, response) => {
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

      ({ query } = JSON.parse(body));

      query = pave.validateQuery({ query, schema, type: 'root' });
    } catch (er) {
      response.statusCode = 400;
      return response.end(er.message);
    }

    try {
      const data = await pave.execute({
        query,
        context: { load: createLoad() },
        schema,
        type: 'root'
      });
      response.setHeader('Content-Type', 'application/json');
      response.statusCode = 200;
      return response.end(JSON.stringify(data));
    } catch (er) {
      const isPublic = er instanceof PublicError;
      const statusCode = isPublic ? 400 : 500;
      response.statusCode = statusCode;
      if (statusCode === 500) console.log(er);
      return response.end(
        isPublic
          ? er.message
          : 'Something went wrong on our end. Please try again later.'
      );
    }
  }

  response.statusCode = 404;
  response.end('Not found');
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  if (request.url !== '/pave') return socket.destroy();
  wss.handleUpgrade(request, socket, head, ws => {
    ws.on('message', async message => {
      try {
        let { query } = JSON.parse(message);
        query = pave.validateQuery({ query, schema, type: 'root' });

        const data = await pave.execute({
          query,
          context: { load: createLoad() },
          schema,
          type: 'root'
        });

        ws.send(JSON.stringify(data));
      } catch (er) {
        const isPublic = er instanceof PublicError;
        ws.send(
          JSON.stringify({
            error: isPublic ? er.message : 'Something went wrong on our end.'
          })
        );
      }
    });
  });
});

export default server;

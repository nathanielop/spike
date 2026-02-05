import { createClient, injectType } from 'pave';

import disk from '#src/constants/disk.js';

const { fetch, window } = globalThis;

const client = createClient({
  cache: disk.get('paveCache'),
  execute: async ({ query }) => {
    let res;
    try {
      res = await fetch(`${window.env.API_URL}/pave`, {
        body: JSON.stringify({ query }),
        method: 'POST'
      });
    } catch (er) {
      throw new Error('Unable to contact the API');
    }

    if (res.ok) return res.json();

    const text = await res.text();
    if (text.startsWith('Invalid grant key')) {
      disk.set('grantKey', null);
      disk.set('paveCache', null);
      client.cache = {};
    } else throw new Error(text);
  },
  getKey: ({ _type, id }) => {
    if (!_type) return null;

    if (_type === 'root') return 'root';

    if (_type && !id) {
      throw new Error(
        `A ${_type} is missing an "id: {}" field. This is required to cache the ${_type} appropriately.`
      );
    }

    return `${_type}:${id}`;
  },
  transformQuery: ({ key, query }) => {
    if (key) return injectType(query);
    return injectType({
      ...query,
      $: { ...query.$, grantKey: disk.get('grantKey') ?? null }
    });
  }
});

client.watch({ onChange: () => disk.set('paveCache', client.cache) });

export default client;

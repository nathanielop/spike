import pave from 'pave';

import disk from '#src/constants/disk.js';

const { fetch, window } = globalThis;

const client = pave.createClient({
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

    throw new Error(await res.text());
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
  }
});

client.watch({ onChange: () => disk.set('paveCache', client.cache) });

export default client;

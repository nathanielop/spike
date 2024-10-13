import { useEffect, useState } from 'endr';
import utf8 from 'utf8';

import history from '#src/constants/history.js';

const { atob, URLSearchParams } = globalThis;

const decode = str => {
  try {
    return JSON.parse(
      utf8.decode(atob(str.replace(/-/g, '+').replace(/_/g, '/')))
    );
  } catch (er) {
    return null;
  }
};

export default () => {
  const [location, setLocation] = useState(history.current);
  const { search, hash, pathname, ...rest } = location;

  useEffect(() => history.listen(setLocation), [setLocation]);

  const entries = Object.fromEntries(new URLSearchParams(search).entries());
  if (!Object.keys(entries).length) return { ...rest, search, hash, pathname };

  const query = {};
  for (const [k, v] of Object.entries(entries)) {
    query[k] = k.endsWith('B64') ? decode(v) : v;
  }

  return { ...rest, search, query, hash, pathname };
};

import db from '#src/constants/db.js';

export default ({ tx = db } = {}) => {
  let loaders = {};

  const loadAndPrime = async (table, id) => {
    const record = await tx.first().from(table).where({ id });
    if (record) prime(table, id, record);
    return record;
  };

  const load = async (table, id) =>
    loaders[table]?.[id] ?? (await loadAndPrime(table, id));

  const clear = (table, id) => {
    if (table) delete loaders[table][id];
    else loaders = {};
    return load;
  };

  const prime = (table, id, value) => {
    loaders[table] = { ...loaders[table], [id]: value };
    return load;
  };

  return Object.assign(load, { clear, prime, tx });
};

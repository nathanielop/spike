const { process } = globalThis;

const { env } = process;

export default {
  database: {
    connectionString: env.POSTGRES_CONNECTION_STRING,
    name: env.POSTGRES_DATABASE_NAME
  },
  ids: {
    alphabet: env.ID_ALPHABET,
    size: parseInt(env.ID_SIZE)
  },
  jtspike: {
    sharedKey: env.SHARED_KEY
  },
  version: env.VERSION
};

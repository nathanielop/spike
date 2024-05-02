const { env } = process;

export default {
  database: {
    connectionString: env.POSTGRES_CONNECTION_STRING
  },
  version: env.VERSION
};

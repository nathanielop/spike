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
    allowedEmailDomains: env.ALLOWED_EMAIL_DOMAINS.split(','),
    appUrl: env.APP_URL,
    sharedKey: env.SHARED_KEY
  },
  slack: {
    webhookUrl: env.SLACK_WEBHOOK_URL
  },
  version: env.VERSION
};

'use strict';

module.exports = ({ env }) => {
  const keys = env.array('APP_KEYS', []);
  if (!keys.length || keys.every(k => !k)) {
    throw new Error('Missing required environment variable: APP_KEYS (comma-separated list of secret keys)');
  }

  return {
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    url: env('PUBLIC_URL', ''),
    app: {
      keys,
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
  };
};

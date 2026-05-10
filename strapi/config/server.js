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
    // Sit behind nginx → :1337 over plain http; without proxy=true, Koa
    // sees ctx.secure=false and the SSO plugin's secure cookie throws
    // "Cannot send secure cookie over unencrypted connection". Enabling
    // proxy makes ctx.secure honor the X-Forwarded-Proto header that
    // nginx already sets.
    proxy: env.bool('STRAPI_TRUST_PROXY', true),
    app: {
      keys,
    },
    webhooks: {
      populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
    },
  };
};

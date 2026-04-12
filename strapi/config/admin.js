'use strict';

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET') || requireEnv('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT') || requireEnv('API_TOKEN_SALT'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT') || requireEnv('TRANSFER_TOKEN_SALT'),
    },
  },
  watchIgnoreFiles: ['**/public/**'],
});

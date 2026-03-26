'use strict';

module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'changeit-changeit-changeit-changeit'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT', 'tobemodified'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT', 'tobemodified'),
    },
  },
  watchIgnoreFiles: ['**/public/**'],
});

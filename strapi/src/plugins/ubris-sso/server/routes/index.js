'use strict';

/**
 * Two endpoints exposed under {@code /admin/ubris-sso}:
 *
 *  - {@code GET /login} starts the Authorization Code flow against the
 *    tenant-identity OAuth2 server (state cookie pinned to the
 *    {@code SameSite=Lax} session).
 *  - {@code GET /callback} consumes the {@code code}, exchanges it for an
 *    ID/access token, validates the JWT, upserts the matching
 *    {@code admin_users} row, mints a Strapi admin JWT, and redirects
 *    the browser into {@code /admin} with the token applied.
 *
 * Both routes live in the {@code admin} type so they ride alongside the
 * built-in admin server (same port, no extra security surface).
 */
module.exports = {
  admin: {
    type: 'admin',
    routes: [
      {
        method: 'GET',
        path: '/ubris-sso/login',
        handler: 'controller.start',
        config: { auth: false, policies: [] },
      },
      {
        method: 'GET',
        path: '/ubris-sso/callback',
        handler: 'controller.callback',
        config: { auth: false, policies: [] },
      },
      {
        method: 'GET',
        path: '/ubris-sso/config',
        handler: 'controller.config',
        config: { auth: false, policies: [] },
      },
    ],
  },
};

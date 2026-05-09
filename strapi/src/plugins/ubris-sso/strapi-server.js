'use strict';

const routes = require('./server/routes');
const controllers = require('./server/controllers');
const services = require('./server/services');

module.exports = {
  register({ strapi }) {},
  bootstrap({ strapi }) {
    if (process.env.UBRIS_SSO_ENABLED !== 'true') {
      strapi.log.info('[ubris-sso] disabled (UBRIS_SSO_ENABLED != true) — skipping bootstrap');
    } else {
      strapi.log.info('[ubris-sso] enabled — admin SSO routes registered at /admin/ubris-sso');
    }
  },
  routes,
  controllers,
  services,
};

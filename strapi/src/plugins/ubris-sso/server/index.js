'use strict';

const routes = require('./routes');
const controllers = require('./controllers');
const services = require('./services');

module.exports = {
  register({ strapi }) {},
  bootstrap({ strapi }) {
    if (process.env.UBRIS_SSO_ENABLED !== 'true') {
      strapi.log.info('[ubris-sso] disabled (UBRIS_SSO_ENABLED != true) — skipping bootstrap');
    } else {
      strapi.log.info('[ubris-sso] enabled — admin SSO routes registered at /ubris-sso');
    }
  },
  routes,
  controllers,
  services,
};

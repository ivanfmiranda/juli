'use strict';

const register = require('./register');
const bootstrap = require('./bootstrap');
const routes = require('./routes');
const controllers = require('./controllers');
const services = require('./services');

module.exports = {
  register,
  bootstrap,
  routes,
  controllers,
  services,
};

'use strict';

const emailTemplates = require('./email-templates');

module.exports = {
  'email-templates': {
    type: 'admin',
    routes: emailTemplates,
  },
};

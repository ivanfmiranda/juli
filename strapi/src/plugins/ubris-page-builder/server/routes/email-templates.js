'use strict';

// Admin-scoped routes — only authenticated Strapi admins can reach them.
// The controller relays each call to ubris-automation using the internal
// API key, so we never need to obtain a Ubris JWT for the admin user.
module.exports = [
  {
    method: 'GET',
    path: '/email-templates',
    handler: 'email-templates.list',
    config: { policies: ['admin::isAuthenticatedAdmin'] },
  },
  {
    method: 'GET',
    path: '/email-templates/:code',
    handler: 'email-templates.get',
    config: { policies: ['admin::isAuthenticatedAdmin'] },
  },
  {
    method: 'PUT',
    path: '/email-templates/:code',
    handler: 'email-templates.upsert',
    config: { policies: ['admin::isAuthenticatedAdmin'] },
  },
  {
    method: 'DELETE',
    path: '/email-templates/:code',
    handler: 'email-templates.delete',
    config: { policies: ['admin::isAuthenticatedAdmin'] },
  },
  {
    method: 'POST',
    path: '/email-templates/preview/:code',
    handler: 'email-templates.preview',
    config: { policies: ['admin::isAuthenticatedAdmin'] },
  },
  {
    method: 'POST',
    path: '/email-templates/preview-inline',
    handler: 'email-templates.previewInline',
    config: { policies: ['admin::isAuthenticatedAdmin'] },
  },
];

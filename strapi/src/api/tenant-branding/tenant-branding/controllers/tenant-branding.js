'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::tenant-branding.tenant-branding', () => ({
  async find(ctx) {
    const tenantId = ctx.request.header['x-tenant-id'];
    if (tenantId && typeof tenantId === 'string' && tenantId.trim()) {
      ctx.query = ctx.query || {};
      ctx.query.filters = ctx.query.filters || {};
      if (ctx.query.filters.tenantKey == null) {
        ctx.query.filters.tenantKey = { $eq: tenantId.trim() };
      }
    }
    return super.find(ctx);
  },
}));

'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::page.page', () => ({
  async find(ctx) {
    enforceTenantFilter(ctx);
    return super.find(ctx);
  },

  async findOne(ctx) {
    enforceTenantFilter(ctx);
    return super.findOne(ctx);
  },
}));

function enforceTenantFilter(ctx) {
  normalizeExplicitTenantAlias(ctx);

  const tenantId = ctx.request.header['x-tenant-id'];
  if (!tenantId || typeof tenantId !== 'string' || !tenantId.trim()) {
    return;
  }

  const normalizedTenantId = tenantId.trim();
  ctx.query = ctx.query || {};
  ctx.query.filters = ctx.query.filters || {};
  if (ctx.query.filters.tenantKey == null) {
    ctx.query.filters.tenantKey = { $eq: normalizedTenantId };
  }
}

function normalizeExplicitTenantAlias(ctx) {
  ctx.query = ctx.query || {};
  ctx.query.filters = ctx.query.filters || {};

  if (ctx.query.filters.tenantKey != null || ctx.query.filters.tenant == null) {
    return;
  }

  const tenant = ctx.query.filters.tenant;
  delete ctx.query.filters.tenant;

  if (typeof tenant === 'string' && tenant.trim()) {
    ctx.query.filters.tenantKey = { $eq: tenant.trim() };
    return;
  }

  if (tenant && typeof tenant === 'object' && tenant.$eq != null) {
    ctx.query.filters.tenantKey = { $eq: String(tenant.$eq).trim() };
  }
}

'use strict';

const PLUGIN_ID = 'ubris-page-builder';

function getService(strapi) {
  return strapi.plugin(PLUGIN_ID).service('email-templates');
}

function requireTenantId(ctx) {
  const tenantId = ctx.query.tenantId || (ctx.request.body && ctx.request.body.tenantId);
  if (!tenantId || !String(tenantId).trim()) {
    ctx.throw(400, 'tenantId query parameter is required');
  }
  return String(tenantId).trim();
}

function adminIdentifier(ctx) {
  const admin = ctx.state && ctx.state.user;
  if (!admin) return 'strapi-plugin';
  return admin.email || admin.username || `admin-${admin.id}`;
}

async function handle(ctx, fn) {
  try {
    await fn();
  } catch (err) {
    const status = err.status || 500;
    ctx.status = status;
    ctx.body = { error: err.message || 'upstream error', upstream: err.body || null };
  }
}

module.exports = {
  async list(ctx) {
    await handle(ctx, async () => {
      const tenantId = requireTenantId(ctx);
      ctx.body = await getService(strapi).list(tenantId);
    });
  },

  async get(ctx) {
    await handle(ctx, async () => {
      const tenantId = requireTenantId(ctx);
      const { code } = ctx.params;
      try {
        ctx.body = await getService(strapi).get(tenantId, code);
      } catch (err) {
        if (err.status === 404) {
          ctx.status = 404;
          ctx.body = { error: 'template not found' };
          return;
        }
        throw err;
      }
    });
  },

  async upsert(ctx) {
    await handle(ctx, async () => {
      const tenantId = requireTenantId(ctx);
      const { code } = ctx.params;
      const content = ctx.request.body && ctx.request.body.content
        ? ctx.request.body.content
        : ctx.request.body;
      ctx.body = await getService(strapi).upsert(tenantId, code, content, adminIdentifier(ctx));
    });
  },

  async delete(ctx) {
    await handle(ctx, async () => {
      const tenantId = requireTenantId(ctx);
      const { code } = ctx.params;
      await getService(strapi).delete(tenantId, code);
      ctx.status = 204;
    });
  },

  async preview(ctx) {
    await handle(ctx, async () => {
      const tenantId = requireTenantId(ctx);
      const { code } = ctx.params;
      const variables = (ctx.request.body && ctx.request.body.variables) || ctx.request.body || {};
      const html = await getService(strapi).preview(tenantId, code, variables);
      ctx.type = 'text/html; charset=utf-8';
      ctx.body = html;
    });
  },

  async previewInline(ctx) {
    await handle(ctx, async () => {
      const tenantId = requireTenantId(ctx);
      const body = ctx.request.body || {};
      if (!body.content) ctx.throw(400, 'content is required');
      const html = await getService(strapi).previewInline(tenantId, body.content, body.variables || {});
      ctx.type = 'text/html; charset=utf-8';
      ctx.body = html;
    });
  },
};

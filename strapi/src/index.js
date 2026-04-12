'use strict';

const path = require('path');
const fs = require('fs');

const PREVIEW_TOKEN_NAME = 'ubris-preview-token';
const EDITOR_TOKEN_NAME = 'ubris-editor-token';
const TMP_DIR = path.join(process.cwd(), '.tmp');

module.exports = {
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    if (internals.shouldGrantPublicRead()) {
      await internals.grantPublicReadPermissions(strapi);
    } else {
      strapi.log.info('[bootstrap] Skipping public permission grant outside dev/test bootstrap');
    }

    if (internals.shouldSeedApiTokens()) {
      await internals.ensureApiTokens(strapi);
    } else {
      strapi.log.info('[bootstrap] Skipping API token auto-seed outside dev/test bootstrap');
    }
  },

  _testing: null,
};

// ---------------------------------------------------------------------------
// Public permissions
// ---------------------------------------------------------------------------

async function grantPublicReadPermissions(strapi) {
  try {
    const publicRole = await strapi
      .query('plugin::users-permissions.role')
      .findOne({ where: { type: 'public' } });

    if (!publicRole) return;

    const actionsToGrant = [
      'api::page.page.find',
      'api::page.page.findOne',
      'api::tenant-branding.tenant-branding.find',
      'api::tenant-branding.tenant-branding.findOne',
    ];

    for (const action of actionsToGrant) {
      const existing = await strapi
        .query('plugin::users-permissions.permission')
        .findOne({ where: { action, role: publicRole.id } });

      if (!existing) {
        await strapi.query('plugin::users-permissions.permission').create({
          data: { action, role: publicRole.id, enabled: true },
        });
      } else if (!existing.enabled) {
        await strapi
          .query('plugin::users-permissions.permission')
          .update({ where: { id: existing.id }, data: { enabled: true } });
      }
    }
  } catch (err) {
    strapi.log.warn('[bootstrap] Could not set public permissions:', err?.message ?? err);
  }
}

// ---------------------------------------------------------------------------
// API Tokens
// ---------------------------------------------------------------------------

async function ensureApiTokens(strapi) {
  if (!fs.existsSync(TMP_DIR)) {
    fs.mkdirSync(TMP_DIR, { recursive: true });
  }

  await ensureToken(strapi, {
    name: PREVIEW_TOKEN_NAME,
    description: 'Read-only token for draft/preview access from the Visual Editor iframe',
    type: 'read-only',
    tokenFile: path.join(TMP_DIR, 'preview-token.txt'),
    envKey: 'STRAPI_PREVIEW_TOKEN',
  });

  await ensureToken(strapi, {
    name: EDITOR_TOKEN_NAME,
    description: 'Full-access token for Visual Editor CRUD and publish operations',
    type: 'full-access',
    tokenFile: path.join(TMP_DIR, 'editor-token.txt'),
    envKey: 'STRAPI_EDITOR_TOKEN',
  });
}

async function ensureToken(strapi, { name, description, type, tokenFile, envKey }) {
  try {
    if (fs.existsSync(tokenFile)) {
      strapi.log.info(`[bootstrap] Token "${name}" already seeded (${tokenFile})`);
      return;
    }

    const existing = await strapi
      .query('admin::api-token')
      .findOne({ where: { name } });

    if (existing) {
      if (!shouldRegenerateMissingTokenFiles()) {
        strapi.log.warn(
          `[bootstrap] Token "${name}" exists but ${tokenFile} is missing. ` +
          'Refusing to rotate automatically; set STRAPI_BOOTSTRAP_REGENERATE_MISSING_TOKEN_FILES=true to recreate it explicitly.'
        );
        return;
      }

      strapi.log.warn(
        `[bootstrap] Token file missing for "${name}". Rotating token because STRAPI_BOOTSTRAP_REGENERATE_MISSING_TOKEN_FILES=true.`
      );
      await strapi.query('admin::api-token').delete({ where: { id: existing.id } });
    }

    const created = await strapi.service('admin::api-token').create({
      name,
      description,
      type,
      lifespan: null,
    });

    const accessKey = created.accessKey;
    fs.writeFileSync(tokenFile, accessKey, 'utf8');

    strapi.log.info(`[bootstrap] Token "${name}" created → ${tokenFile}`);
    strapi.log.info(`[bootstrap] Use ${envKey} from ${tokenFile} if a downstream consumer needs it.`);
  } catch (err) {
    strapi.log.warn(`[bootstrap] Could not create token "${name}":`, err?.message ?? err);
  }
}

function shouldGrantPublicRead() {
  return isDevOrTestBootstrap() || envFlag('STRAPI_BOOTSTRAP_ALLOW_PUBLIC_READ');
}

function shouldSeedApiTokens() {
  return isDevOrTestBootstrap() || envFlag('STRAPI_BOOTSTRAP_ALLOW_TOKEN_SEED');
}

function shouldRegenerateMissingTokenFiles() {
  return envFlag('STRAPI_BOOTSTRAP_REGENERATE_MISSING_TOKEN_FILES');
}

function isDevOrTestBootstrap() {
  const env = String(process.env.NODE_ENV || '').trim().toLowerCase();
  return env === 'development' || env === 'test';
}

function envFlag(name) {
  return String(process.env[name] || '').trim().toLowerCase() === 'true';
}

const internals = {
  envFlag,
  ensureApiTokens,
  ensureToken,
  grantPublicReadPermissions,
  isDevOrTestBootstrap,
  shouldGrantPublicRead,
  shouldRegenerateMissingTokenFiles,
  shouldSeedApiTokens,
};

module.exports._testing = internals;

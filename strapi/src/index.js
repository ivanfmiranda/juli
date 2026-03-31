'use strict';

const path = require('path');
const fs = require('fs');

const PREVIEW_TOKEN_NAME = 'ubris-preview-token';
const EDITOR_TOKEN_NAME = 'ubris-editor-token';
const TMP_DIR = path.join(process.cwd(), '.tmp');

module.exports = {
  register(/*{ strapi }*/) {},

  async bootstrap({ strapi }) {
    await grantPublicReadPermissions(strapi);
    await ensureApiTokens(strapi);
  },
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
    // If token file already exists, the token was already seeded — skip creation
    if (fs.existsSync(tokenFile)) {
      strapi.log.info(`[bootstrap] Token "${name}" already seeded (${tokenFile})`);
      return;
    }

    // Allow pre-configuring via env var (deterministic tokens in CI/staging)
    const predefined = process.env[envKey];

    const existing = await strapi
      .query('admin::api-token')
      .findOne({ where: { name } });

    if (existing && !predefined) {
      // Token exists in DB but file was deleted — cannot recover plaintext.
      // Regenerate: delete old record and create fresh.
      strapi.log.warn(
        `[bootstrap] Token file missing for "${name}". Regenerating token — update all consumers.`
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
    strapi.log.info(`[bootstrap] ${envKey}=${accessKey}`);
  } catch (err) {
    strapi.log.warn(`[bootstrap] Could not create token "${name}":`, err?.message ?? err);
  }
}

'use strict';

// Thin client for ubris-automation's /internal/notification-templates.
// Auth is a server-to-server shared secret (X-API-Key); the calling Strapi
// admin has already been validated by the route-level `isAuthenticatedAdmin`
// policy, so we can treat this as a trusted bridge.

function automationUrl() {
  return (
    process.env.UBRIS_AUTOMATION_URL ||
    process.env.AUTOMATION_URL ||
    'http://ubris-automation:8108'
  );
}

function headers(tenantId, updatedBy) {
  const key = process.env.UBRIS_INTERNAL_API_KEY;
  if (!key) {
    // Fail closed if the operator forgot to provision the secret —
    // otherwise every call would 401 and the UI would show a cryptic error.
    throw new Error('UBRIS_INTERNAL_API_KEY is not configured in Strapi env');
  }
  const h = {
    'X-API-Key': key,
    'X-Tenant-Id': tenantId,
    'Content-Type': 'application/json; charset=utf-8',
  };
  if (updatedBy) h['X-Updated-By'] = updatedBy;
  return h;
}

async function callJson(method, path, tenantId, { body, updatedBy, rawText } = {}) {
  const url = `${automationUrl()}${path}`;
  const init = {
    method,
    headers: headers(tenantId, updatedBy),
  };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(url, init);
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`ubris-automation ${method} ${path} → ${res.status}: ${text}`);
    err.status = res.status;
    err.body = text;
    throw err;
  }
  if (rawText) return text;
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

module.exports = () => ({
  list(tenantId) {
    return callJson('GET', '/internal/notification-templates', tenantId);
  },
  get(tenantId, code) {
    return callJson('GET', `/internal/notification-templates/${encodeURIComponent(code)}`, tenantId);
  },
  upsert(tenantId, code, content, updatedBy) {
    return callJson('PUT', `/internal/notification-templates/${encodeURIComponent(code)}`,
      tenantId, { body: content, updatedBy });
  },
  delete(tenantId, code) {
    return callJson('DELETE', `/internal/notification-templates/${encodeURIComponent(code)}`, tenantId);
  },
  preview(tenantId, code, variables) {
    return callJson('POST', `/internal/notification-templates/preview/${encodeURIComponent(code)}`,
      tenantId, { body: variables || {}, rawText: true });
  },
  previewInline(tenantId, content, variables) {
    return callJson('POST', '/internal/notification-templates/preview-inline',
      tenantId, { body: { content, variables: variables || {} }, rawText: true });
  },
});

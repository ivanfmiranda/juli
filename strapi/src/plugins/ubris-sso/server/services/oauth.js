'use strict';

const crypto = require('crypto');
const { createRemoteJWKSet, jwtVerify } = require('jose');

/**
 * In-process cache of the JWKS from {@code UBRIS_SSO_JWKS_URL}. The
 * library handles rotation + caching internally, so a single long-lived
 * instance is correct — repeated calls reuse the same fetcher.
 */
let cachedJwks = null;

/**
 * Returns the configured JWKS resolver, lazily built on first use. Empty
 * config keeps the resolver null so service methods can short-circuit.
 */
function jwksResolver() {
  const url = process.env.UBRIS_SSO_JWKS_URL;
  if (!url) return null;
  if (!cachedJwks) {
    cachedJwks = createRemoteJWKSet(new URL(url));
  }
  return cachedJwks;
}

module.exports = ({ strapi }) => ({
  /**
   * True when {@code UBRIS_SSO_ENABLED=true} AND the minimum env set is
   * present. Without {@code authorize/token/jwks/issuer/clientId/redirectUri}
   * the redirect would 500 on the first call, so we hide it instead.
   */
  enabled() {
    if (process.env.UBRIS_SSO_ENABLED !== 'true') return false;
    return !!(process.env.UBRIS_SSO_AUTHORIZE_URL
      && process.env.UBRIS_SSO_TOKEN_URL
      && process.env.UBRIS_SSO_JWKS_URL
      && process.env.UBRIS_SSO_ISSUER
      && process.env.UBRIS_SSO_CLIENT_ID
      && process.env.UBRIS_SSO_REDIRECT_URI);
  },

  /**
   * Build the {@code /oauth2/authorize} URL with PKCE. Returns the
   * URL plus the verifier/state pair the controller has to set on the
   * response cookie so the callback can verify the round-trip.
   */
  buildAuthorizeUrl(returnTo) {
    const verifier = crypto.randomBytes(32).toString('base64url');
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
    const state = crypto.randomBytes(16).toString('base64url');

    const url = new URL(process.env.UBRIS_SSO_AUTHORIZE_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', process.env.UBRIS_SSO_CLIENT_ID);
    url.searchParams.set('redirect_uri', process.env.UBRIS_SSO_REDIRECT_URI);
    url.searchParams.set('scope', 'openid profile email');
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('state', state);

    return {
      authorizeUrl: url.toString(),
      verifier,
      state,
      returnTo: returnTo || '/admin',
    };
  },

  /**
   * Exchange an authorization code for an ID/access token bundle. PKCE
   * verifier is required (matches the challenge sent in
   * {@link buildAuthorizeUrl}).
   */
  async exchangeCode({ code, codeVerifier }) {
    const body = new URLSearchParams();
    body.set('grant_type', 'authorization_code');
    body.set('code', code);
    body.set('redirect_uri', process.env.UBRIS_SSO_REDIRECT_URI);
    body.set('client_id', process.env.UBRIS_SSO_CLIENT_ID);
    body.set('code_verifier', codeVerifier);
    if (process.env.UBRIS_SSO_CLIENT_SECRET) {
      body.set('client_secret', process.env.UBRIS_SSO_CLIENT_SECRET);
    }

    const resp = await fetch(process.env.UBRIS_SSO_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Token exchange failed (${resp.status}): ${text}`);
    }
    return resp.json();
  },

  /**
   * Verify a JWT against the JWKS, issuer, and audience. Returns the
   * verified payload — caller maps claims to a Strapi admin user.
   */
  async verifyJwt(token) {
    const resolver = jwksResolver();
    if (!resolver) {
      throw new Error('UBRIS_SSO_JWKS_URL is not configured');
    }
    const { payload } = await jwtVerify(token, resolver, {
      issuer: process.env.UBRIS_SSO_ISSUER,
      audience: process.env.UBRIS_SSO_CLIENT_ID,
    });
    return payload;
  },

  /**
   * Ensures a {@code admin_users} row exists for the verified payload's
   * email and returns it.
   *
   * <p>Authorization gate: only Ubris backoffice roles get through —
   * SUPER_ADMIN, ADMIN, OPERATOR, STAFF, VIEWER (with optional ROLE_
   * prefix). Storefront roles (CUSTOMER, etc.) are rejected outright so
   * a compromised customer JWT can't escalate into the CMS admin UI.
   *
   * <p>Provisional mapping (a richer hierarchy is planned later):
   * <ul>
   *   <li>SUPER_ADMIN, ADMIN → Strapi Super Admin</li>
   *   <li>OPERATOR, STAFF    → Strapi Editor</li>
   *   <li>VIEWER             → Strapi Author</li>
   * </ul>
   *
   * <p>If the user already exists we DO NOT downgrade their role — admins
   * can manually elevate someone via the Strapi UI and our SSO path
   * should never silently revoke their privileges.
   */
  async upsertAdminUser(payload) {
    const email = payload.email;
    if (!email) {
      throw new Error('JWT missing email claim');
    }
    const userService = strapi.admin.services.user;
    const roleService = strapi.admin.services.role;

    const targetRoleCode = mapRoleCode(payload.roles || []);
    if (!targetRoleCode) {
      const err = new Error(`User ${email} has no backoffice role; SSO denied`);
      err.code = 'NOT_BACKOFFICE';
      throw err;
    }

    const targetRole = await roleService.findOne({ code: targetRoleCode });
    if (!targetRole) {
      throw new Error(`Strapi role ${targetRoleCode} not present — seed it first`);
    }

    let user = await userService.findOneByEmail(email);
    if (!user) {
      user = await userService.create({
        email,
        firstname: payload.given_name || payload.name || email.split('@')[0],
        lastname: payload.family_name || 'Ubris',
        isActive: true,
        roles: [targetRole.id],
      });
      strapi.log.info(`[ubris-sso] created admin_user email=${email} role=${targetRoleCode}`);
    } else {
      strapi.log.info(`[ubris-sso] reusing admin_user id=${user.id} email=${email}`);
    }
    return user;
  },

  /**
   * Mint a Strapi admin JWT for the given user. The Strapi auth service
   * exposes {@code createJwtToken(user)} on the admin scope; reusing it
   * keeps signing keys / algorithm aligned with the ones that validate
   * subsequent admin requests.
   */
  createStrapiAdminToken(user) {
    return strapi.admin.services.token.createJwtToken(user);
  },
});

/**
 * Maps Ubris JWT roles[] → Strapi role code, or null when no backoffice
 * role matches (caller rejects). Roles are matched case-insensitively
 * with optional {@code ROLE_} prefix because the JWT has stripped it
 * historically while some seed paths kept it.
 */
function mapRoleCode(roles) {
  if (!Array.isArray(roles) || roles.length === 0) return null;
  const normalized = roles
    .map(r => String(r || '').trim().toUpperCase())
    .map(r => r.replace(/^ROLE_/, ''));
  if (normalized.some(r => r === 'SUPER_ADMIN' || r === 'PLATFORM_ADMIN')) {
    return 'strapi-super-admin';
  }
  if (normalized.some(r => r === 'ADMIN')) {
    return 'strapi-super-admin';
  }
  if (normalized.some(r => r === 'OPERATOR' || r === 'STAFF')) {
    return 'strapi-editor';
  }
  if (normalized.some(r => r === 'VIEWER')) {
    return 'strapi-author';
  }
  // CUSTOMER, GUEST, anything else — explicitly rejected.
  return null;
}

'use strict';

const STATE_COOKIE = 'ubris_sso_state';
const VERIFIER_COOKIE = 'ubris_sso_verifier';
const RETURN_COOKIE = 'ubris_sso_return';
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: true,
  maxAge: 5 * 60 * 1000,
  path: '/ubris-sso',
};

module.exports = {
  /**
   * GET /admin/ubris-sso/config
   * Read-only payload the admin app uses to decide whether to render
   * the "Log in with Ubris" button on the login page.
   */
  async config(ctx) {
    const oauth = strapi.plugin('ubris-sso').service('oauth');
    ctx.body = {
      enabled: oauth.enabled(),
      loginUrl: '/ubris-sso/login',
    };
  },

  /**
   * GET /admin/ubris-sso/login
   * Build the authorize URL with PKCE, drop the verifier/state on
   * SameSite=Lax cookies, redirect to the Ubris OAuth2 server.
   */
  async start(ctx) {
    const oauth = strapi.plugin('ubris-sso').service('oauth');
    if (!oauth.enabled()) {
      return ctx.notFound('Ubris SSO is not enabled');
    }
    const returnTo = typeof ctx.query.returnTo === 'string' ? ctx.query.returnTo : '/admin';
    const { authorizeUrl, verifier, state } = oauth.buildAuthorizeUrl(returnTo);

    ctx.cookies.set(STATE_COOKIE, state, COOKIE_OPTS);
    ctx.cookies.set(VERIFIER_COOKIE, verifier, COOKIE_OPTS);
    ctx.cookies.set(RETURN_COOKIE, returnTo, COOKIE_OPTS);

    ctx.redirect(authorizeUrl);
  },

  /**
   * GET /admin/ubris-sso/callback
   * Validate state, exchange code, verify ID token, upsert admin user,
   * mint a Strapi JWT, redirect to the admin app with the token in
   * the URL fragment so the SPA can pick it up and store as session.
   */
  async callback(ctx) {
    const oauth = strapi.plugin('ubris-sso').service('oauth');
    if (!oauth.enabled()) {
      return ctx.notFound('Ubris SSO is not enabled');
    }

    const expectedState = ctx.cookies.get(STATE_COOKIE);
    const verifier = ctx.cookies.get(VERIFIER_COOKIE);
    const returnTo = ctx.cookies.get(RETURN_COOKIE) || '/admin';
    ctx.cookies.set(STATE_COOKIE, null, { ...COOKIE_OPTS, maxAge: 0 });
    ctx.cookies.set(VERIFIER_COOKIE, null, { ...COOKIE_OPTS, maxAge: 0 });
    ctx.cookies.set(RETURN_COOKIE, null, { ...COOKIE_OPTS, maxAge: 0 });

    const { code, state, error, error_description: errorDesc } = ctx.query;
    if (error) {
      strapi.log.warn(`[ubris-sso] callback error from IdP: ${error} ${errorDesc || ''}`);
      return ctx.redirect('/admin/auth/login?ssoError=1');
    }
    if (!code || !state || !expectedState || state !== expectedState) {
      strapi.log.warn('[ubris-sso] callback state mismatch — possible CSRF or stale link');
      return ctx.redirect('/admin/auth/login?ssoError=state');
    }
    if (!verifier) {
      strapi.log.warn('[ubris-sso] callback missing PKCE verifier cookie');
      return ctx.redirect('/admin/auth/login?ssoError=verifier');
    }

    let tokens;
    try {
      tokens = await oauth.exchangeCode({ code, codeVerifier: verifier });
    } catch (ex) {
      strapi.log.warn(`[ubris-sso] code exchange failed: ${ex.message}`);
      return ctx.redirect('/admin/auth/login?ssoError=exchange');
    }

    const idToken = tokens.id_token || tokens.access_token;
    if (!idToken) {
      strapi.log.warn('[ubris-sso] token response missing id_token AND access_token');
      return ctx.redirect('/admin/auth/login?ssoError=noToken');
    }

    let payload;
    try {
      payload = await oauth.verifyJwt(idToken);
    } catch (ex) {
      strapi.log.warn(`[ubris-sso] JWT verify failed: ${ex.message}`);
      return ctx.redirect('/admin/auth/login?ssoError=verify');
    }

    let user;
    try {
      user = await oauth.upsertAdminUser(payload);
    } catch (ex) {
      const reason = ex.code === 'NOT_BACKOFFICE' ? 'forbidden' : 'user';
      strapi.log.warn(`[ubris-sso] admin user upsert failed (${reason}): ${ex.message}`);
      return ctx.redirect(`/admin/auth/login?ssoError=${reason}`);
    }

    const strapiToken = oauth.createStrapiAdminToken(user);

    // The Strapi admin SPA reads its session JWT from
    // {@code localStorage.jwtToken} on every request. We can't set
    // localStorage from the OAuth callback domain directly, so we
    // serve a tiny HTML page that runs in the admin origin, persists
    // the token, and finishes the redirect to {@code returnTo}.
    const safeReturn = sanitizeReturn(returnTo);
    const tokenJson = JSON.stringify(strapiToken);
    const returnJson = JSON.stringify(safeReturn);
    ctx.set('Content-Type', 'text/html; charset=utf-8');
    ctx.set('Cache-Control', 'no-store');
    ctx.body = `<!doctype html>
<html><head><meta charset="utf-8"><title>Ubris CMS</title></head>
<body><script>
(function(){
  try {
    var t = ${tokenJson};
    localStorage.setItem('jwtToken', JSON.stringify(t));
    sessionStorage.setItem('jwtToken', JSON.stringify(t));
  } catch (e) { /* fall through to login */ }
  window.location.replace(${returnJson});
})();
</script>
<noscript>JavaScript is required to complete sign-in. <a href="${safeReturn}">Continue</a>.</noscript>
</body></html>`;
  },
};

/**
 * Only allow same-origin paths to prevent open-redirect via {@code returnTo}.
 * Cookie content is attacker-controlled in theory (someone could craft a
 * /admin/ubris-sso/login?returnTo=https://evil.example link), so we anchor
 * the returnTo to the admin tree.
 */
function sanitizeReturn(target) {
  if (typeof target !== 'string' || !target.startsWith('/')) return '/admin';
  if (target.startsWith('//') || target.includes('://')) return '/admin';
  return target;
}

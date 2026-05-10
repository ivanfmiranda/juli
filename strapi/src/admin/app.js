'use strict';

// Anti-advertising customization: bury references to "Strapi" / strapi.io
// behind Ubris-flavoured copy and hide the upstream marketplace / "what's
// new" sidebar items. Telemetry + update notification are turned off via
// env (STRAPI_TELEMETRY_DISABLED / STRAPI_DISABLE_UPDATE_NOTIFICATION).
export default {
  config: {
    head: {
      favicon: '',
    },
    locales: [],
    translations: {
      en: {
        'app.components.LeftMenu.navbrand.title': 'Ubris CMS',
        'app.components.LeftMenu.navbrand.workplace': 'Ubris Platform',
        'Auth.form.welcome.title': 'Ubris CMS',
        'Auth.form.welcome.subtitle': 'Log in to your Ubris CMS account',
        'Auth.form.button.login.strapi': 'Log in with Ubris',
        'app.components.HomePage.welcome': 'Welcome to Ubris CMS',
        'app.components.HomePage.welcome.again': 'Welcome back to Ubris CMS',
        'app.components.HomePage.welcomeBlock.content': 'Manage tenant content, blocks, and storefront copy here.',
      },
      'pt-BR': {
        'app.components.LeftMenu.navbrand.title': 'Ubris CMS',
        'app.components.LeftMenu.navbrand.workplace': 'Plataforma Ubris',
        'Auth.form.welcome.title': 'Ubris CMS',
        'Auth.form.welcome.subtitle': 'Acesse sua conta Ubris CMS',
        'Auth.form.button.login.strapi': 'Entrar com Ubris',
        'app.components.HomePage.welcome': 'Bem-vindo ao Ubris CMS',
        'app.components.HomePage.welcome.again': 'Bem-vindo de volta ao Ubris CMS',
        'app.components.HomePage.welcomeBlock.content': 'Gerencie o conteúdo do tenant, blocos e copy do storefront aqui.',
      },
    },
    theme: {
      light: {},
      dark: {},
    },
    // Hide release notes notifications + tutorials buttons that point
    // back to strapi.io. Marketplace plugin entry (when present) is
    // hidden by the CSS injected in bootstrap.
    notifications: { releases: false },
    tutorials: false,
  },
  bootstrap(app) {
    // Inject CSS that hides residual Strapi promo elements that aren't
    // exposed via the config above (e.g. "Try Strapi Cloud" footer,
    // marketplace nav, upgrade banners).
    if (typeof document !== 'undefined') {
      const css = `
        /* Upstream Strapi promo / marketplace links. */
        a[href*="strapi.io"],
        a[href*="market.strapi.io"],
        a[href*="cloud.strapi.io"],
        a[aria-label*="marketplace" i],
        a[href$="/marketplace"],
        a[href*="purchase-strapi-enterprise"] { display: none !important; }

        /* SSO button styling — matches Strapi's primary action look. */
        .ubris-sso-button {
          display: block;
          width: 100%;
          margin-top: 12px;
          padding: 10px 16px;
          background: #4945ff;
          color: #ffffff;
          border: 1px solid #4945ff;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          text-decoration: none;
          cursor: pointer;
        }
        .ubris-sso-button:hover { background: #7b79ff; border-color: #7b79ff; }
        .ubris-sso-error {
          margin-top: 12px;
          padding: 10px 12px;
          border: 1px solid #f5c6cb;
          background: #f8d7da;
          color: #721c24;
          border-radius: 4px;
          font-size: 13px;
        }
      `;
      const style = document.createElement('style');
      style.dataset.ubrisAntiAd = '1';
      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);

      // Inject "Entrar com Ubris" on the admin login page. The Strapi
      // admin SPA renders the form asynchronously, so we observe DOM
      // mutations until the form shows up, then attach the SSO button
      // after it. The /admin/ubris-sso/config endpoint reports whether
      // SSO is enabled — when disabled (UBRIS_SSO_ENABLED=false), the
      // button never appears and the local password form stays as the
      // only login path.
      let ssoConfigPromise = null;
      const fetchSsoConfig = () => {
        if (!ssoConfigPromise) {
          ssoConfigPromise = fetch('/ubris-sso/config', { credentials: 'include' })
            .then(r => (r.ok ? r.json() : { enabled: false }))
            .catch(() => ({ enabled: false }));
        }
        return ssoConfigPromise;
      };

      const ssoErrorMessages = {
        '1': 'O provedor SSO recusou a operação.',
        state: 'Sessão SSO expirou. Tente novamente.',
        verifier: 'Sessão SSO incompleta. Tente novamente.',
        exchange: 'Falha ao trocar o código de autorização.',
        noToken: 'Resposta do provedor não trouxe um token de identidade.',
        verify: 'Token do provedor inválido.',
        forbidden: 'Sua conta não tem perfil de backoffice. Procure um administrador.',
        user: 'Falha ao criar/recuperar usuário a partir do SSO.',
      };

      const showSsoErrorBanner = (form) => {
        const params = new URLSearchParams(window.location.search);
        const ssoError = params.get('ssoError');
        if (!ssoError || form.querySelector('.ubris-sso-error')) return;
        const div = document.createElement('div');
        div.className = 'ubris-sso-error';
        div.textContent = ssoErrorMessages[ssoError] || 'Falha no login via SSO.';
        form.insertBefore(div, form.firstChild);
      };

      const tryInjectSsoButton = async () => {
        if (!window.location.pathname.startsWith('/admin/auth/login')) return false;
        const form = document.querySelector('form');
        if (!form || form.querySelector('.ubris-sso-button')) return false;
        showSsoErrorBanner(form);
        const cfg = await fetchSsoConfig();
        if (!cfg.enabled) return true; // stop observing — SSO off
        const btn = document.createElement('a');
        btn.className = 'ubris-sso-button';
        btn.href = cfg.loginUrl || '/ubris-sso/login';
        btn.textContent = 'Entrar com Ubris';
        form.appendChild(btn);
        return true;
      };

      // Observe routing changes — Strapi navigates client-side, so the
      // login form may mount/unmount without a full reload.
      const observer = new MutationObserver(() => { tryInjectSsoButton(); });
      observer.observe(document.documentElement, { childList: true, subtree: true });
      tryInjectSsoButton();
    }
  },
};

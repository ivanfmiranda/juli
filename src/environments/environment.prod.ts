export const environment = {
  production: true,
  strapiApiBaseUrl: '/strapi-api',
  ubrisApiBaseUrl: '/ubris-api',
  defaultCmsSlug: 'home',
  defaultLocale: 'pt-BR',
  fallbackLocale: 'en-US',
  supportedLocales: [
    { code: 'pt-BR', language: 'pt', label: 'Português (Brasil)', currency: 'BRL' },
    { code: 'en-US', language: 'en', label: 'English (US)', currency: 'USD' }
  ]
};

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
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

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.

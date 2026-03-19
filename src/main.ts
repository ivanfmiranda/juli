import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => {
    console.error(err);
    const pre = document.createElement('pre');
    pre.style.whiteSpace = 'pre-wrap';
    pre.style.padding = '24px';
    pre.style.margin = '0';
    pre.style.fontFamily = 'Consolas, Monaco, monospace';
    pre.style.background = '#fff1f2';
    pre.style.color = '#7f1d1d';
    pre.textContent = err?.stack || err?.message || String(err);
    document.body.innerHTML = '';
    document.body.appendChild(pre);
  });

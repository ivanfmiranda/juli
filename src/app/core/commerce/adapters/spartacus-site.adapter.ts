import { Injectable } from '@angular/core';
import { BaseSite, Country, CountryType, Currency, Language, Region, SiteAdapter } from '@spartacus/core';
import { Observable, of } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable()
export class JuliSpartacusSiteAdapter extends SiteAdapter {
  private readonly languages: Language[] = environment.supportedLocales.map(locale => ({
    active: locale.code === environment.defaultLocale,
    isocode: locale.language,
    name: locale.label,
    nativeName: locale.label
  }));

  private readonly currencies: Currency[] = environment.supportedLocales
    .map(locale => locale.currency)
    .filter((currency, index, all) => all.indexOf(currency) === index)
    .map(currency => ({
      active: currency === environment.supportedLocales[0].currency,
      isocode: currency,
      name: currency,
      symbol: currency === 'BRL' ? 'R$' : '$'
    }));

  private readonly baseSites: BaseSite[] = [
    {
      uid: 'electronics',
      name: 'Ubris Electronics',
      locale: environment.defaultLocale,
      channel: 'B2C',
      defaultLanguage: this.languages[0],
      stores: [
        {
          defaultCurrency: this.currencies[0],
          currencies: this.currencies,
          defaultLanguage: this.languages[0],
          languages: this.languages
        }
      ]
    }
  ];

  loadLanguages(): Observable<Language[]> {
    return of(this.languages);
  }

  loadCurrencies(): Observable<Currency[]> {
    return of(this.currencies);
  }

  loadCountries(_type?: CountryType): Observable<Country[]> {
    return of([]);
  }

  loadRegions(_countryIsoCode: string): Observable<Region[]> {
    return of([]);
  }

  loadBaseSite(siteUid?: string): Observable<BaseSite | undefined> {
    return of(this.baseSites.find(site => site.uid === (siteUid || 'electronics')));
  }

  loadBaseSites(): Observable<BaseSite[]> {
    return of(this.baseSites);
  }
}

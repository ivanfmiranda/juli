import { Injectable } from '@angular/core';
import { BaseSite, Country, CountryType, Currency, Language, Region, SiteAdapter } from '@spartacus/core';
import { Observable, of } from 'rxjs';

@Injectable()
export class JuliSpartacusSiteAdapter extends SiteAdapter {
  private readonly languages: Language[] = [
    {
      active: true,
      isocode: 'en',
      name: 'English',
      nativeName: 'English'
    }
  ];

  private readonly currencies: Currency[] = [
    {
      active: true,
      isocode: 'USD',
      name: 'US Dollar',
      symbol: '$'
    }
  ];

  private readonly baseSites: BaseSite[] = [
    {
      uid: 'electronics',
      name: 'Ubris Electronics',
      locale: 'en-US',
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

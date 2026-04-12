import { Injectable } from '@angular/core';
import { SearchConfig } from '../models/ubris-commerce.models';
import { Observable } from 'rxjs';

interface ProductSearchPage {
  freeTextSearch?: string;
  products?: Array<{ name?: string; code?: string; [key: string]: unknown }>;
  pagination?: { currentPage?: number; pageSize?: number; totalResults?: number; totalPages?: number };
  [key: string]: unknown;
}

interface Suggestion {
  value?: string;
  [key: string]: unknown;
}
import { map } from 'rxjs/operators';
import { UbrisSearchAdapter } from '../adapters/search.adapter';
import { UbrisSearchNormalizer } from '../normalizers/search.normalizer';

@Injectable({ providedIn: 'root' })
export class UbrisProductSearchConnector {
  constructor(
    private readonly adapter: UbrisSearchAdapter,
    private readonly normalizer: UbrisSearchNormalizer
  ) {}

  search(query: string, searchConfig?: SearchConfig): Observable<ProductSearchPage> {
    const page = searchConfig?.currentPage ?? 0;
    const size = searchConfig?.pageSize ?? 12;
    const sort = (searchConfig as any)?.sort;
    return this.adapter.search(query, page, size, sort).pipe(
      map(response => this.normalizer.normalize(response.data, query, searchConfig))
    );
  }

  getSuggestions(term: string, pageSize?: number): Observable<Suggestion[]> {
    return this.search(term, { pageSize, currentPage: 0 }).pipe(
      map(page => this.normalizer.suggestions(page))
    );
  }
}
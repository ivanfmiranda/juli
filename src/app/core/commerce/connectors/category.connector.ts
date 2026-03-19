import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UbrisCategoryAdapter } from '../adapters/category.adapter';
import { JuliCategoryPage } from '../models/ubris-commerce.models';
import { UbrisCategoryNormalizer } from '../normalizers/category.normalizer';

@Injectable({ providedIn: 'root' })
export class UbrisCategoryConnector {
  constructor(
    private readonly adapter: UbrisCategoryAdapter,
    private readonly normalizer: UbrisCategoryNormalizer
  ) {}

  get(code: string, page: number = 0, size: number = 12): Observable<JuliCategoryPage> {
    return this.adapter.get(code, page, size).pipe(
      map(response => this.normalizer.normalize(code, response.data))
    );
  }
}
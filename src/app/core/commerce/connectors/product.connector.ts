import { Injectable } from '@angular/core';
import { Product } from '@spartacus/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { UbrisProductAdapter } from '../adapters/product.adapter';
import { UbrisProductNormalizer } from '../normalizers/product.normalizer';

@Injectable({ providedIn: 'root' })
export class UbrisProductConnector {
  constructor(
    private readonly adapter: UbrisProductAdapter,
    private readonly normalizer: UbrisProductNormalizer
  ) {}

  get(productCode: string, _scope?: string): Observable<Product> {
    return this.adapter.get(productCode).pipe(
      map(response => this.normalizer.normalize(response.data) ?? { code: productCode })
    );
  }

  getMany(products: Array<{ productCode: string; scope?: string }>): Array<{ productCode: string; scope?: string; product$: Observable<Product> }> {
    return products.map(product => ({
      ...product,
      product$: this.get(product.productCode, product.scope)
    }));
  }
}
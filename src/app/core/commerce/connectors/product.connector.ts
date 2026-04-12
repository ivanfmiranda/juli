import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UbrisProductAdapter } from '../adapters/product.adapter';
import { UbrisProductNormalizer } from '../normalizers/product.normalizer';

export type JuliProductModel = { code?: string; name?: string; [key: string]: unknown };

@Injectable({ providedIn: 'root' })
export class UbrisProductConnector {
  constructor(
    private readonly adapter: UbrisProductAdapter,
    private readonly normalizer: UbrisProductNormalizer
  ) {}

  get(productCode: string, _scope?: string): Observable<JuliProductModel> {
    return this.adapter.get(productCode).pipe(
      map(response => this.normalizer.normalize(response.data) ?? { code: productCode })
    );
  }

  getMany(products: Array<{ productCode: string; scope?: string }>): Array<{ productCode: string; scope?: string; product$: Observable<JuliProductModel> }> {
    return products.map(product => ({
      ...product,
      product$: this.get(product.productCode, product.scope)
    }));
  }
}

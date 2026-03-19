import { Injectable } from '@angular/core';
import { OrderHistoryList } from '@spartacus/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { UbrisOrderAdapter } from '../adapters/order.adapter';
import { UbrisOrderNormalizer } from '../normalizers/order.normalizer';

@Injectable({ providedIn: 'root' })
export class UbrisOrderConnector {
  constructor(
    private readonly adapter: UbrisOrderAdapter,
    private readonly normalizer: UbrisOrderNormalizer
  ) {}

  list(customerId: string): Observable<OrderHistoryList> {
    return this.adapter.list(customerId).pipe(
      map(response => this.normalizer.normalize(response.data))
    );
  }
}
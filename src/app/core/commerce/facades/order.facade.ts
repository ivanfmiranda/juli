import { Injectable } from '@angular/core';
import { OrderHistoryList } from '@spartacus/core';
import { Observable } from 'rxjs';
import { UbrisOrderConnector } from '../connectors/order.connector';

@Injectable({ providedIn: 'root' })
export class JuliOrderFacade {
  constructor(private readonly connector: UbrisOrderConnector) {}

  list(customerId: string): Observable<OrderHistoryList> {
    return this.connector.list(customerId);
  }
}
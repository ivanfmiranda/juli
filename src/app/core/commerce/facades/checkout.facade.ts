import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { JuliCheckoutResult, JuliCheckoutSubmission } from '../models/ubris-commerce.models';
import { UbrisCheckoutConnector } from '../connectors/checkout.connector';

@Injectable({ providedIn: 'root' })
export class JuliCheckoutFacade {
  constructor(private readonly connector: UbrisCheckoutConnector) {}

  submit(body: JuliCheckoutSubmission): Observable<JuliCheckoutResult> {
    return this.connector.submit(body);
  }

  status(checkoutId: string): Observable<JuliCheckoutResult> {
    return this.connector.status(checkoutId);
  }
}
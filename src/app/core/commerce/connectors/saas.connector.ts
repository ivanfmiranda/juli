import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { JuliSaaSAdapter } from '../adapters/saas.adapter';
import { TenantContext, UsageLimitSummary, FeatureEntitlement } from '../../models/saas.models';

@Injectable({ providedIn: 'root' })
export class JuliSaaSConnector {
  constructor(private readonly adapter: JuliSaaSAdapter) {}

  getContext(): Observable<TenantContext> {
    return this.adapter.getTenantContext().pipe(
      map(res => res.data!)
    );
  }

  getUsage(): Observable<UsageLimitSummary[]> {
    return this.adapter.getSubscriptionUsage().pipe(
      map(res => res.data ?? [])
    );
  }

  getEntitlements(): Observable<FeatureEntitlement[]> {
    return this.adapter.getEntitlements().pipe(
      map(res => res.data ?? [])
    );
  }
}

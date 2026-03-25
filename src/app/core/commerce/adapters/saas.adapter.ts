import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GatewayEnvelope } from '../models/ubris-commerce.models';
import { TenantContext, UsageLimitSummary, FeatureEntitlement } from '../../models/saas.models';

@Injectable({ providedIn: 'root' })
export class JuliSaaSAdapter {
  constructor(private readonly http: HttpClient) {}

  getTenantContext(): Observable<GatewayEnvelope<TenantContext>> {
    return this.http.get<GatewayEnvelope<TenantContext>>(
      `${environment.ubrisApiBaseUrl}/api/bff/tenant/context`
    );
  }

  getSubscriptionUsage(): Observable<GatewayEnvelope<UsageLimitSummary[]>> {
    return this.http.get<GatewayEnvelope<UsageLimitSummary[]>>(
      `${environment.ubrisApiBaseUrl}/api/bff/billing/usage`
    );
  }

  getEntitlements(): Observable<GatewayEnvelope<FeatureEntitlement[]>> {
    return this.http.get<GatewayEnvelope<FeatureEntitlement[]>>(
      `${environment.ubrisApiBaseUrl}/api/bff/billing/entitlements`
    );
  }
}

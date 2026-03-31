import { Injectable } from '@angular/core';

export interface JuliTenantHostContext {
  host: string;
  tenantId: string;
  baseSiteId: string;
  systemHost: boolean;
}

@Injectable({ providedIn: 'root' })
export class TenantHostService {
  private static readonly RESERVED_SUBDOMAINS = new Set(['www', 'cms', 'backoffice', 'ucp']);

  current(): JuliTenantHostContext {
    const host = this.normalizedHost();
    const tenantId = this.resolveTenantId(host);
    return {
      host,
      tenantId,
      baseSiteId: `site-${tenantId}`,
      systemHost: tenantId === 'default'
    };
  }

  currentTenantId(): string {
    try {
      const override = localStorage.getItem('__preview_tenant');
      if (override) return override;
    } catch { /* noop */ }
    return this.current().tenantId;
  }

  currentBaseSiteId(): string {
    return this.current().baseSiteId;
  }

  private normalizedHost(): string {
    if (typeof window === 'undefined' || !window.location?.hostname) {
      return 'localhost';
    }
    return window.location.hostname.trim().toLowerCase();
  }

  private resolveTenantId(host: string): string {
    if (!host || host === 'localhost' || host === '127.0.0.1') {
      return 'default';
    }

    if (host.endsWith('.localhost')) {
      return this.normalizeTenant(host.slice(0, -'.localhost'.length));
    }

    if (host === 'ubris.com.br' || host === 'www.ubris.com.br') {
      return 'default';
    }

    if (host.endsWith('.ubris.com.br')) {
      const subdomain = host.slice(0, -'.ubris.com.br'.length);
      if (TenantHostService.RESERVED_SUBDOMAINS.has(subdomain)) {
        return 'default';
      }
      return this.normalizeTenant(subdomain);
    }

    return 'default';
  }

  private normalizeTenant(candidate: string): string {
    if (!candidate) {
      return 'default';
    }
    const normalized = candidate.trim().toLowerCase();
    return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(normalized) ? normalized : 'default';
  }
}

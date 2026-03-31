import { Injectable } from '@angular/core';

const TOKEN_KEY = '__preview_token';
const TENANT_KEY = '__preview_tenant';
const CATALOG_KEY = '__preview_catalog_version';

@Injectable({ providedIn: 'root' })
export class PreviewTokenService {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch { /* noop */ }
  }

  getTenantOverride(): string | null {
    try {
      return localStorage.getItem(TENANT_KEY);
    } catch {
      return null;
    }
  }

  setTenantOverride(tenant: string): void {
    try {
      localStorage.setItem(TENANT_KEY, tenant);
    } catch { /* noop */ }
  }

  getCatalogVersion(): string | null {
    try {
      return localStorage.getItem(CATALOG_KEY);
    } catch {
      return null;
    }
  }

  setCatalogVersion(version: string): void {
    try {
      localStorage.setItem(CATALOG_KEY, version);
    } catch { /* noop */ }
  }

  clearAll(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TENANT_KEY);
      localStorage.removeItem(CATALOG_KEY);
    } catch { /* noop */ }
  }
}

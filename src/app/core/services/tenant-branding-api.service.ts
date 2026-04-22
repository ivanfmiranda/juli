import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { TenantHostService } from './tenant-host.service';

export interface NavCategory {
  code: string;
  label: string;
  /** Either a Lucide icon name (preferred) OR a legacy emoji glyph. */
  icon: string;
  translationKey?: string;
  /** Overrides the default {@code /c/{code}} route. Useful for nav items
   *  that should resolve to a search query ({@code /search?q=renault}) or
   *  a landing page rather than a catalog taxonomy node. */
  url?: string;
  /** Optional grouping label rendered as a section header in the mega-menu.
   *  When absent the item appears in the flat nav. Reserved for when the
   *  header gets a dropdown (K2 vehicle-brand mega-menu). */
  group?: string;
}

export interface FooterLinkSet {
  shop: Array<{ name: string; url: string }>;
  support: Array<{ name: string; url: string }>;
  company: Array<{ name: string; url: string }>;
}

export interface TenantBrandingConfig {
  tenantKey: string;
  brandName: string;
  brandIcon: string;
  logoUrl: string | null;
  theme: Record<string, string>;
  navCategories: NavCategory[];
  footerLinks: FooterLinkSet;
  promoText: string | null;
}

const DEFAULT_BRANDING: TenantBrandingConfig = {
  tenantKey: 'default',
  brandName: 'JULI',
  brandIcon: '🛍️',
  logoUrl: null,
  theme: {},
  navCategories: [
    { code: 'eletronicos', label: '', icon: '📱', translationKey: 'categories.electronics' },
    { code: 'moda', label: '', icon: '👕', translationKey: 'categories.fashion' },
    { code: 'casa', label: '', icon: '🏠', translationKey: 'categories.home' },
    { code: 'esportes', label: '', icon: '⚽', translationKey: 'categories.sports' },
    { code: 'beleza', label: '', icon: '💄', translationKey: 'categories.beauty' },
  ],
  footerLinks: {
    shop: [
      { name: 'categories.electronics', url: '/c/eletronicos' },
      { name: 'categories.fashion', url: '/c/moda' },
      { name: 'categories.home', url: '/c/casa' },
      { name: 'header.sale', url: '/c/promocoes' },
    ],
    support: [
      { name: 'Central de Ajuda', url: '/page/ajuda' },
      { name: 'Trocas e Devoluções', url: '/page/trocas' },
      { name: 'Entregas', url: '/page/entregas' },
      { name: 'Pagamentos', url: '/page/pagamentos' },
    ],
    company: [
      { name: 'Sobre a JULI', url: '/sobre' },
      { name: 'Trabalhe Conosco', url: '/page/carreiras' },
      { name: 'Seja um Parceiro', url: '/page/parceiros' },
      { name: 'Blog', url: '/page/blog' },
    ],
  },
  promoText: null,
};

/**
 * Read SSR-injected branding from window.__TENANT_BRANDING__ to avoid FOUC.
 * Falls back to DEFAULT_BRANDING if not present (e.g. default tenant or dev mode).
 */
function getInitialBranding(): TenantBrandingConfig {
  try {
    const w = typeof window !== 'undefined' ? (window as any) : null;
    const ssrData = w?.__TENANT_BRANDING__;
    if (ssrData && ssrData.tenantKey) {
      return {
        tenantKey: ssrData.tenantKey,
        brandName: ssrData.brandName || 'JULI',
        brandIcon: ssrData.brandIcon || '🛍️',
        logoUrl: ssrData.logoUrl || null,
        theme: ssrData.theme || {},
        navCategories: Array.isArray(ssrData.navCategories) ? ssrData.navCategories : DEFAULT_BRANDING.navCategories,
        footerLinks: ssrData.footerLinks || DEFAULT_BRANDING.footerLinks,
        promoText: ssrData.promoText || null,
      };
    }
  } catch { /* noop */ }
  return DEFAULT_BRANDING;
}

@Injectable({ providedIn: 'root' })
export class TenantBrandingApiService {
  private readonly branding$ = new BehaviorSubject<TenantBrandingConfig>(getInitialBranding());
  private loaded = false;

  readonly config$: Observable<TenantBrandingConfig> = this.branding$.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly tenantHost: TenantHostService,
  ) {}

  /** Fetch branding from Strapi API. Call once at app init. */
  load(): Observable<TenantBrandingConfig> {
    if (this.loaded) return this.config$;
    this.loaded = true;

    // If SSR already provided branding, emit it and skip HTTP
    const current = this.branding$.value;
    if (current.tenantKey !== 'default') {
      return of(current);
    }

    const tenantId = this.tenantHost.currentTenantId();
    return this.http
      .get<any>(`/strapi-api/tenant-brandings?filters[tenantKey]=${encodeURIComponent(tenantId)}`)
      .pipe(
        map(response => {
          const items = response?.data;
          if (!Array.isArray(items) || items.length === 0) return DEFAULT_BRANDING;
          const attrs = items[0].attributes;
          return {
            tenantKey: attrs.tenantKey || tenantId,
            brandName: attrs.brandName || 'JULI',
            brandIcon: attrs.brandIcon || '🛍️',
            logoUrl: attrs.logoUrl || null,
            theme: attrs.theme || {},
            navCategories: attrs.navCategories || DEFAULT_BRANDING.navCategories,
            footerLinks: attrs.footerLinks || DEFAULT_BRANDING.footerLinks,
            promoText: attrs.promoText || null,
          } as TenantBrandingConfig;
        }),
        catchError(() => of(DEFAULT_BRANDING)),
        tap(config => this.branding$.next(config)),
      );
  }

  /** Synchronous snapshot (available after load completes). */
  get snapshot(): TenantBrandingConfig {
    return this.branding$.value;
  }
}

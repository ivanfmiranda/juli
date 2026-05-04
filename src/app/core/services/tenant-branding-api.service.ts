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

export interface LegalInfo {
  cnpj?: string;
  razaoSocial?: string;
  inscricaoEstadual?: string;
}

export interface AddressInfo {
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

export interface PaymentMethod {
  name: string;
  icon: string;
}

export interface SocialLink {
  name: string;
  icon: string;
  url: string;
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
  contactPhone: string | null;
  contactEmail: string | null;
  supportHours: string | null;
  legal: LegalInfo;
  address: AddressInfo;
  paymentMethods: PaymentMethod[];
  socialLinks: SocialLink[];
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
      { name: 'footerLinks.shop.featured', url: '/c/destaques' },
      { name: 'footerLinks.shop.new', url: '/c/novidades' },
      { name: 'footerLinks.shop.sale', url: '/c/promocoes' },
      { name: 'footerLinks.shop.all', url: '/c/todos' },
    ],
    support: [
      { name: 'footerLinks.support.faq', url: '/page/faq' },
      { name: 'footerLinks.support.returns', url: '/page/termos' },
      { name: 'footerLinks.support.privacy', url: '/page/privacidade' },
      { name: 'footerLinks.support.contact', url: '/page/contato' },
    ],
    company: [
      { name: 'footerLinks.company.about', url: '/page/sobre' },
      { name: 'footerLinks.company.contact', url: '/page/contato' },
      { name: 'footerLinks.company.terms', url: '/page/termos' },
      { name: 'footerLinks.company.cookies', url: '/page/cookies' },
    ],
  },
  promoText: null,
  contactPhone: null,
  contactEmail: null,
  supportHours: null,
  legal: {},
  address: {},
  paymentMethods: [
    { name: 'Visa', icon: '💳' },
    { name: 'Mastercard', icon: '💳' },
    { name: 'Elo', icon: '💳' },
    { name: 'Pix', icon: '📱' },
  ],
  socialLinks: [
    { name: 'Instagram', icon: '📷', url: '#' },
    { name: 'Facebook', icon: '👍', url: '#' },
    { name: 'YouTube', icon: '▶️', url: '#' },
  ],
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
        contactPhone: ssrData.contactPhone || null,
        contactEmail: ssrData.contactEmail || null,
        supportHours: ssrData.supportHours || null,
        legal: ssrData.legal || {},
        address: ssrData.address || {},
        paymentMethods: Array.isArray(ssrData.paymentMethods) ? ssrData.paymentMethods : DEFAULT_BRANDING.paymentMethods,
        socialLinks: Array.isArray(ssrData.socialLinks) ? ssrData.socialLinks : DEFAULT_BRANDING.socialLinks,
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
            contactPhone: attrs.contactPhone || null,
            contactEmail: attrs.contactEmail || null,
            supportHours: attrs.supportHours || null,
            legal: attrs.legal || {},
            address: attrs.address || {},
            paymentMethods: Array.isArray(attrs.paymentMethods) ? attrs.paymentMethods : DEFAULT_BRANDING.paymentMethods,
            socialLinks: Array.isArray(attrs.socialLinks) ? attrs.socialLinks : DEFAULT_BRANDING.socialLinks,
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

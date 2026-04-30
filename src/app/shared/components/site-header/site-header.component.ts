/**
 * Site Header Component
 *
 * Header comercial premium do JULI.
 * Navigation categories and branding are fetched from the tenant-branding API.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { B2bContextService, B2bAssignment } from '../../../core/user/b2b-context.service';
import { JuliCartFacade } from '../../../core/commerce';
import { JuliI18nService, JuliLocaleConfig } from '../../../core/i18n/i18n.service';
import { TenantBrandingApiService, NavCategory } from '../../../core/services/tenant-branding-api.service';
import { IconName } from '../icon/icon.component';

@Component({
  selector: 'app-site-header',
  templateUrl: './site-header.component.html',
  styleUrls: ['./site-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteHeaderComponent implements OnInit, OnDestroy {
  readonly isLoggedIn$: Observable<boolean> = this.authService.session$.pipe(
    map(session => !!session)
  );

  readonly b2bContext$: Observable<B2bAssignment | null> = this.b2bContextService.context$;

  readonly cartTotal$: Observable<number> = this.cartFacade.itemCount$;
  readonly activeLocale$: Observable<JuliLocaleConfig> = this.i18n.activeLocale$;
  readonly locales = this.i18n.locales;

  brandName = 'JULI';
  brandIcon = '🛍️';
  logoUrl: string | null = null;
  categories: NavCategory[] = [];
  useTenantNav = false;
  promoText: string | null = null;

  searchQuery = '';
  mobileMenuOpen = false;
  accountMenuOpen = false;

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly cartFacade: JuliCartFacade,
    private readonly router: Router,
    private readonly i18n: JuliI18nService,
    private readonly brandingApi: TenantBrandingApiService,
    private readonly cdr: ChangeDetectorRef,
    private readonly b2bContextService: B2bContextService,
  ) {}

  ngOnInit(): void {
    this.brandingApi.config$.pipe(takeUntil(this.destroy$)).subscribe(config => {
      this.brandName = config.brandName;
      this.brandIcon = config.brandIcon;
      this.logoUrl = config.logoUrl;
      this.categories = config.navCategories;
      this.useTenantNav = config.tenantKey !== 'default';
      this.promoText = config.promoText;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearch(): void {
    if (this.searchQuery.trim()) {
      void this.router.navigate(['/search'], {
        queryParams: { q: this.searchQuery.trim() }
      });
    }
  }

  logout(): void {
    this.authService.logout();
    void this.router.navigate(['/']);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleAccountMenu(): void {
    this.accountMenuOpen = !this.accountMenuOpen;
  }

  closeAccountMenu(): void {
    this.accountMenuOpen = false;
    this.cdr.markForCheck();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.accountMenuOpen && !target.closest('.account-menu-wrapper')) {
      this.closeAccountMenu();
    }
  }

  changeLocale(locale: string): void {
    this.i18n.setLocale(locale);
  }

  /**
   * Resolves the Angular router link for a nav category. When the CMS
   * provides an explicit {@code url} (e.g. {@code /search?q=renault} for
   * vehicle-brand pills in K2), we use it verbatim; otherwise we fall
   * back to the legacy {@code /c/{code}} taxonomy route.
   */
  categoryRouterLink(cat: NavCategory): any[] | string {
    if (cat.url) {
      const [path] = cat.url.split('?');
      return path || ['/c', cat.code];
    }
    return ['/c', cat.code];
  }

  categoryQueryParams(cat: NavCategory): Record<string, string> | null {
    if (!cat.url || !cat.url.includes('?')) return null;
    const query = cat.url.substring(cat.url.indexOf('?') + 1);
    const params: Record<string, string> = {};
    for (const part of query.split('&')) {
      const [k, v] = part.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
    return params;
  }

  /**
   * Accepts either a canonical Lucide name (preferred) or a legacy
   * emoji glyph stored by older tenant-branding rows. Falls back to a
   * neutral icon so a misconfigured nav never breaks the layout.
   */
  resolveNavIcon(raw: string | undefined): IconName {
    if (!raw) return 'badge-check';
    const trimmed = raw.trim().toLowerCase();
    const validNames: IconName[] = [
      'shopping-cart', 'x', 'heart', 'star', 'package', 'truck',
      'shield-check', 'credit-card', 'wrench', 'headset', 'search',
      'check', 'zap', 'lock', 'badge-check', 'arrow-right',
    ];
    if ((validNames as string[]).includes(trimmed)) return trimmed as IconName;
    const emojiMap: Record<string, IconName> = {
      '🛒': 'shopping-cart', '❤️': 'heart', '⭐': 'star',
      '📦': 'package', '🚚': 'truck', '🛡️': 'shield-check',
      '💳': 'credit-card', '🔧': 'wrench', '🛠️': 'wrench',
      '🎧': 'headset', '🔍': 'search', '✅': 'check',
      '⚡': 'zap', '🏷️': 'zap', '🔒': 'lock', '🔐': 'lock',
      '🚀': 'zap', '✔️': 'badge-check',
    };
    return emojiMap[trimmed] ?? 'badge-check';
  }
}

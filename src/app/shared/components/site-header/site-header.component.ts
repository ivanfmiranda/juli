/**
 * Site Header Component
 *
 * Header comercial premium do JULI.
 * Navigation categories and branding are fetched from the tenant-branding API.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { JuliCartFacade } from '../../../core/commerce';
import { JuliI18nService, JuliLocaleConfig } from '../../../core/i18n/i18n.service';
import { TenantBrandingApiService, NavCategory } from '../../../core/services/tenant-branding-api.service';

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

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly authService: AuthService,
    private readonly cartFacade: JuliCartFacade,
    private readonly router: Router,
    private readonly i18n: JuliI18nService,
    private readonly brandingApi: TenantBrandingApiService,
    private readonly cdr: ChangeDetectorRef,
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

  changeLocale(locale: string): void {
    this.i18n.setLocale(locale);
  }
}

/**
 * Site Header Component
 * 
 * Header comercial premium do JULI.
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { JuliCartFacade } from '../../../core/commerce';
import { JuliI18nService, JuliLocaleConfig } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-site-header',
  templateUrl: './site-header.component.html',
  styleUrls: ['./site-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteHeaderComponent {
  readonly isLoggedIn$: Observable<boolean> = this.authService.session$.pipe(
    map(session => !!session)
  );
  
  readonly cartTotal$: Observable<number> = this.cartFacade.itemCount$;
  readonly activeLocale$: Observable<JuliLocaleConfig> = this.i18n.activeLocale$;
  readonly locales = this.i18n.locales;

  readonly categories = [
    { code: 'eletronicos', translationKey: 'categories.electronics', icon: '📱' },
    { code: 'moda', translationKey: 'categories.fashion', icon: '👕' },
    { code: 'casa', translationKey: 'categories.home', icon: '🏠' },
    { code: 'esportes', translationKey: 'categories.sports', icon: '⚽' },
    { code: 'beleza', translationKey: 'categories.beauty', icon: '💄' },
  ];

  searchQuery = '';
  mobileMenuOpen = false;

  constructor(
    private readonly authService: AuthService,
    private readonly cartFacade: JuliCartFacade,
    private readonly router: Router,
    private readonly i18n: JuliI18nService
  ) {}

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

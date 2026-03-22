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

  readonly categories = [
    { code: 'eletronicos', name: 'Eletrônicos', icon: '📱' },
    { code: 'moda', name: 'Moda', icon: '👕' },
    { code: 'casa', name: 'Casa & Decoração', icon: '🏠' },
    { code: 'esportes', name: 'Esportes', icon: '⚽' },
    { code: 'beleza', name: 'Beleza', icon: '💄' },
  ];

  searchQuery = '';
  mobileMenuOpen = false;

  constructor(
    private readonly authService: AuthService,
    private readonly cartFacade: JuliCartFacade,
    private readonly router: Router
  ) {}

  onSearch(): void {
    if (this.searchQuery.trim()) {
      void this.router.navigate(['/search'], {
        queryParams: { q: this.searchQuery.trim() }
      });
    }
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }
}

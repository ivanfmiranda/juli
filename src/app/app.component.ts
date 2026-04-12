import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import { AuthService } from './core/auth/auth.service';
import { JuliCartFacade } from './core/commerce';
import { TenantBrandingApiService } from './core/services/tenant-branding-api.service';
import { JuliBrandingService } from './core/services/juli-branding.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit {
  readonly searchControl = new FormControl('');
  readonly session$ = this.authService.session$;
  readonly cartCount$ = this.cartFacade.itemCount$;

  constructor(
    private readonly authService: AuthService,
    private readonly cartFacade: JuliCartFacade,
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly brandingApi: TenantBrandingApiService,
    private readonly branding: JuliBrandingService,
  ) {}

  ngOnInit(): void {
    this.brandingApi.load().subscribe(config => {
      this.titleService.setTitle(
        config.brandName !== 'JULI' ? config.brandName : 'Juli Store'
      );
      this.branding.applyTenantTheme(config);
    });
  }

  search(): void {
    const query = (this.searchControl.value || '').trim();
    void this.router.navigate(['/search'], {
      queryParams: query ? { q: query } : {}
    });
  }

  logout(): void {
    this.authService.logout();
  }
}

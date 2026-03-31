import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { FormControl } from '@angular/forms';
import { AuthService } from './core/auth/auth.service';
import { JuliCartFacade } from './core/commerce';
import { TenantHostService } from './core/services/tenant-host.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly searchControl = new FormControl('');
  readonly session$ = this.authService.session$;
  readonly cartCount$ = this.cartFacade.itemCount$;

  constructor(
    private readonly authService: AuthService,
    private readonly cartFacade: JuliCartFacade,
    private readonly router: Router,
    private readonly titleService: Title,
    private readonly tenantHost: TenantHostService,
  ) {
    const tenantId = this.tenantHost.currentTenantId();
    const name = tenantId && tenantId !== 'default'
      ? tenantId.charAt(0).toUpperCase() + tenantId.slice(1)
      : 'Juli Store';
    this.titleService.setTitle(name);

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

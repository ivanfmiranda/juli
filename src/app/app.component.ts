import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormControl } from '@angular/forms';
import { AuthService } from './core/auth/auth.service';
import { JuliCartFacade } from './core/commerce';

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
    private readonly router: Router
  ) {}

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

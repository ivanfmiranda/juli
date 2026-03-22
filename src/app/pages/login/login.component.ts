import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { of } from 'rxjs';
import { catchError, finalize, switchMap } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { JuliCartFacade } from '../../core/commerce';

@Component({
  selector: 'app-login-page',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoginComponent {
  readonly form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required]
  });

  submitting = false;
  errorMessage?: string;
  warningMessage?: string;

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly cartFacade: JuliCartFacade,
    private readonly router: Router
  ) {}

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const username = this.form.value.username ?? '';
    const password = this.form.value.password ?? '';
    const redirect = this.router.parseUrl(this.router.url).queryParams['redirect'] || '/';

    this.submitting = true;
    this.errorMessage = undefined;
    this.warningMessage = undefined;

    this.authService.login(username, password).pipe(
      switchMap(() => {
        if (!this.authService.hasAnonymousCart()) {
          return of(null);
        }

        return this.cartFacade.promoteAnonymousCart().pipe(
          catchError(error => {
            this.cartFacade.discardAnonymousCart();
            this.warningMessage = 'Login concluído, mas o carrinho anterior expirou e não pôde ser recuperado.';
            return of(null);
          })
        );
      }),
      finalize(() => {
        this.submitting = false;
      })
    ).subscribe({
      next: () => {
        void this.router.navigateByUrl(redirect);
      },
      error: error => {
        this.errorMessage = error?.error?.message || error?.message || 'Login failed';
      }
    });
  }
}

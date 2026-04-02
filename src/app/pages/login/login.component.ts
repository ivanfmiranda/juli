import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { of, timer } from 'rxjs';
import { catchError, finalize, retryWhen, switchMap, take, timeout } from 'rxjs/operators';
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
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly cdr: ChangeDetectorRef
  ) {}

  submit(): void {
    if (this.form.invalid || this.submitting) {
      this.form.markAllAsTouched();
      return;
    }

    const username = this.form.value.username ?? '';
    const password = this.form.value.password ?? '';
    const redirect = this.route.snapshot.queryParams['redirect'] || '/';

    this.submitting = true;
    this.errorMessage = undefined;
    this.warningMessage = undefined;

    this.authService.login(username, password).pipe(
      timeout(15000),
      switchMap(() => {
        if (!this.authService.hasAnonymousCart()) {
          return of(null);
        }

        return this.cartFacade.promoteAnonymousCart().pipe(
          retryWhen(errors => errors.pipe(
            switchMap((err, attempt) => attempt < 2 ? timer(500 * (attempt + 1)) : of(err)),
            take(3)
          )),
          catchError(() => {
            this.warningMessage = 'Login concluído, mas o carrinho anterior não pôde ser recuperado.';
            this.cdr.markForCheck();
            return of(null);
          })
        );
      }),
      finalize(() => {
        this.submitting = false;
        this.cdr.markForCheck();
      })
    ).subscribe({
      next: () => {
        void this.router.navigateByUrl(redirect);
      },
      error: () => {
        this.errorMessage = 'Usuário ou senha inválidos.';
        this.cdr.markForCheck();
      }
    });
  }
}

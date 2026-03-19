import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormBuilder, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';

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

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
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

    this.authService.login(username, password).pipe(
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
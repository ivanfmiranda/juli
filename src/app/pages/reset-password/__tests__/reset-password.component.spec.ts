import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { JuliI18nService } from '../../../core/i18n/i18n.service';
import { TenantBrandingApiService } from '../../../core/services/tenant-branding-api.service';
import { ResetPasswordComponent } from '../reset-password.component';

@Pipe({ name: 'juliTranslate' })
class MockJuliTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

function buildTestBed(queryParams: Record<string, string>) {
  const authService = jasmine.createSpyObj<AuthService>('AuthService', ['confirmPasswordReset']);
  const titleService = jasmine.createSpyObj<Title>('Title', ['setTitle']);
  const brandingApi = jasmine.createSpyObj<TenantBrandingApiService>('TenantBrandingApiService', ['load'], {
    snapshot: {
      tenantKey: 'default',
      brandName: 'JULI',
      brandIcon: '🛍️',
      logoUrl: null,
      theme: {},
      navCategories: [],
      footerLinks: { shop: [], support: [], company: [] },
      promoText: null
    }
  });
  const i18n = jasmine.createSpyObj<JuliI18nService>('JuliI18nService', ['translate']);
  i18n.translate.and.callFake((key: string) => key);

  const activatedRoute = {
    snapshot: {
      queryParamMap: convertToParamMap(queryParams)
    }
  } as unknown as ActivatedRoute;

  return { authService, titleService, brandingApi, i18n, activatedRoute };
}

describe('ResetPasswordComponent', () => {
  it('flags tokenMissing when no token is in the query string', async () => {
    const { authService, titleService, brandingApi, i18n, activatedRoute } = buildTestBed({});
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [ResetPasswordComponent, MockJuliTranslatePipe],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Title, useValue: titleService },
        { provide: TenantBrandingApiService, useValue: brandingApi },
        { provide: JuliI18nService, useValue: i18n },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    const fixture: ComponentFixture<ResetPasswordComponent> = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.tokenMissing).toBeTrue();
    expect(fixture.componentInstance.token).toBeNull();
  });

  it('submits successfully and navigates to login with reset=success', async () => {
    const { authService, titleService, brandingApi, i18n, activatedRoute } = buildTestBed({ token: 'opaque-token' });
    authService.confirmPasswordReset.and.returnValue(of(undefined));
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [ResetPasswordComponent, MockJuliTranslatePipe],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Title, useValue: titleService },
        { provide: TenantBrandingApiService, useValue: brandingApi },
        { provide: JuliI18nService, useValue: i18n },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    const fixture: ComponentFixture<ResetPasswordComponent> = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    const navigate = spyOn(router, 'navigate').and.returnValue(Promise.resolve(true));

    fixture.componentInstance.form.setValue({ password: 'longenough1', confirmPassword: 'longenough1' });
    fixture.componentInstance.submit();

    expect(authService.confirmPasswordReset).toHaveBeenCalledWith('opaque-token', 'longenough1');
    expect(navigate).toHaveBeenCalledWith(['/login'], { queryParams: { reset: 'success' } });
  });

  it('rejects mismatched passwords without contacting the backend', async () => {
    const { authService, titleService, brandingApi, i18n, activatedRoute } = buildTestBed({ token: 'opaque-token' });
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [ResetPasswordComponent, MockJuliTranslatePipe],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Title, useValue: titleService },
        { provide: TenantBrandingApiService, useValue: brandingApi },
        { provide: JuliI18nService, useValue: i18n },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    const fixture: ComponentFixture<ResetPasswordComponent> = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({ password: 'longenough1', confirmPassword: 'different12' });
    fixture.componentInstance.submit();

    expect(authService.confirmPasswordReset).not.toHaveBeenCalled();
    expect(fixture.componentInstance.form.hasError('passwordMismatch')).toBeTrue();
  });

  it('maps a 400 response to the invalidToken copy', async () => {
    const { authService, titleService, brandingApi, i18n, activatedRoute } = buildTestBed({ token: 'opaque-token' });
    authService.confirmPasswordReset.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 400, statusText: 'Bad Request' }))
    );
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [ResetPasswordComponent, MockJuliTranslatePipe],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Title, useValue: titleService },
        { provide: TenantBrandingApiService, useValue: brandingApi },
        { provide: JuliI18nService, useValue: i18n },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();
    const fixture: ComponentFixture<ResetPasswordComponent> = TestBed.createComponent(ResetPasswordComponent);
    fixture.detectChanges();

    fixture.componentInstance.form.setValue({ password: 'longenough1', confirmPassword: 'longenough1' });
    fixture.componentInstance.submit();

    expect(fixture.componentInstance.errorMessage).toBe('auth.resetPassword.invalidToken');
  });
});

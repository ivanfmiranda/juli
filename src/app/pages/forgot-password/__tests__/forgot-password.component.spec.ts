import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { JuliI18nService } from '../../../core/i18n/i18n.service';
import { TenantBrandingApiService } from '../../../core/services/tenant-branding-api.service';
import { ForgotPasswordComponent } from '../forgot-password.component';

@Pipe({ name: 'juliTranslate' })
class MockJuliTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('ForgotPasswordComponent', () => {
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let component: ForgotPasswordComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let titleService: jasmine.SpyObj<Title>;
  let brandingApi: jasmine.SpyObj<TenantBrandingApiService>;
  let i18n: jasmine.SpyObj<JuliI18nService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['requestPasswordReset']);
    titleService = jasmine.createSpyObj<Title>('Title', ['setTitle']);
    brandingApi = jasmine.createSpyObj<TenantBrandingApiService>('TenantBrandingApiService', ['load'], {
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
    i18n = jasmine.createSpyObj<JuliI18nService>('JuliI18nService', ['translate']);
    i18n.translate.and.callFake((key: string) => key);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [ForgotPasswordComponent, MockJuliTranslatePipe],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Title, useValue: titleService },
        { provide: TenantBrandingApiService, useValue: brandingApi },
        { provide: JuliI18nService, useValue: i18n }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows inbox confirmation after a successful request (regardless of email existence)', () => {
    authService.requestPasswordReset.and.returnValue(of(undefined));
    component.form.setValue({ email: 'user@example.com' });

    component.submit();

    expect(authService.requestPasswordReset).toHaveBeenCalledWith('user@example.com');
    expect(component.submitted).toBeTrue();
    expect(component.errorMessage).toBeUndefined();
  });

  it('blocks submission when email is invalid and does not call the backend', () => {
    component.form.setValue({ email: 'not-an-email' });

    component.submit();

    expect(authService.requestPasswordReset).not.toHaveBeenCalled();
    expect(component.submitted).toBeFalse();
  });

  it('surfaces a generic error message when the request itself fails', () => {
    authService.requestPasswordReset.and.returnValue(throwError(() => new Error('network down')));
    component.form.setValue({ email: 'user@example.com' });

    component.submit();

    expect(component.submitted).toBeFalse();
    expect(component.errorMessage).toBe('auth.forgotPassword.genericError');
  });
});

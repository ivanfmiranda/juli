import { NO_ERRORS_SCHEMA, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { JuliCartFacade } from '../../../core/commerce';
import { JuliI18nService } from '../../../core/i18n/i18n.service';
import { TenantBrandingApiService } from '../../../core/services/tenant-branding-api.service';
import { LoginComponent } from '../login.component';

@Pipe({ name: 'juliTranslate' })
class MockJuliTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let cartFacade: jasmine.SpyObj<JuliCartFacade>;
  let titleService: jasmine.SpyObj<Title>;
  let brandingApi: jasmine.SpyObj<TenantBrandingApiService>;
  let i18n: jasmine.SpyObj<JuliI18nService>;
  let router: Router;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['login', 'hasAnonymousCart']);
    cartFacade = jasmine.createSpyObj<JuliCartFacade>('JuliCartFacade', ['promoteAnonymousCart', 'discardAnonymousCart']);
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
    i18n.translate.and.callFake((key: string) => {
      if (key === 'login.invalidCredentials') {
        return 'Usuário ou senha inválidos.';
      }
      if (key === 'login.cartPromotionWarning') {
        return 'Login concluído, mas não foi possível recuperar o carrinho anterior.';
      }
      return key;
    });

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [LoginComponent, MockJuliTranslatePipe],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: JuliCartFacade, useValue: cartFacade },
        { provide: Title, useValue: titleService },
        { provide: TenantBrandingApiService, useValue: brandingApi },
        { provide: JuliI18nService, useValue: i18n }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();

    spyOn(router, 'navigateByUrl').and.returnValue(Promise.resolve(true));
    authService.login.and.returnValue(of({
      accessToken: 'token',
      tokenType: 'Bearer',
      expiresIn: 3600,
      username: 'demo',
      roles: []
    }));
    authService.hasAnonymousCart.and.returnValue(false);
    cartFacade.promoteAnonymousCart.and.returnValue(of({
      cart: { code: 'cart-1' } as any,
      mergeOccurred: false,
      cartChanged: true,
      warnings: []
    }));
  });

  it('promotes an anonymous cart after a successful login', () => {
    authService.hasAnonymousCart.and.returnValue(true);
    component.form.setValue({ username: 'demo', password: 'secret' });

    component.submit();

    expect(authService.login).toHaveBeenCalledWith('demo', 'secret');
    expect(cartFacade.promoteAnonymousCart).toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });

  it('falls back gracefully when anonymous cart promotion fails', () => {
    authService.hasAnonymousCart.and.returnValue(true);
    cartFacade.promoteAnonymousCart.and.returnValue(
      throwError(new Error('promotion failed'))
    );
    component.form.setValue({ username: 'demo', password: 'secret' });

    component.submit();

    expect(cartFacade.discardAnonymousCart).toHaveBeenCalled();
    expect(component.warningMessage).toContain('Login concluído');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/');
  });
});

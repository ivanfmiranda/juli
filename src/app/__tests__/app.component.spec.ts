import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';
import { AppComponent } from '../app.component';
import { AuthService } from '../core/auth/auth.service';
import { JuliCartFacade } from '../core/commerce';
import { TenantBrandingApiService } from '../core/services/tenant-branding-api.service';
import { JuliBrandingService } from '../core/services/juli-branding.service';

describe('AppComponent', () => {
  let fixture: ComponentFixture<AppComponent>;
  let component: AppComponent;
  let authService: jasmine.SpyObj<AuthService>;
  let cartFacade: jasmine.SpyObj<JuliCartFacade>;
  let titleService: jasmine.SpyObj<Title>;
  let brandingApi: jasmine.SpyObj<TenantBrandingApiService>;
  let brandingService: jasmine.SpyObj<JuliBrandingService>;

  beforeEach(async () => {
    authService = jasmine.createSpyObj<AuthService>('AuthService', ['logout'], {
      session$: of(null)
    });
    cartFacade = jasmine.createSpyObj<JuliCartFacade>('JuliCartFacade', ['clear'], {
      itemCount$: of(0)
    });
    titleService = jasmine.createSpyObj<Title>('Title', ['setTitle']);
    brandingApi = jasmine.createSpyObj<TenantBrandingApiService>('TenantBrandingApiService', ['load'], {
      snapshot: {
        brandName: 'JULI',
        brandIcon: '🛍️',
        footerLinks: { shop: [], support: [], company: [] },
        logoUrl: null,
        navCategories: [],
        promoText: null,
        tenantKey: 'default',
        theme: {}
      }
    });
    brandingApi.load.and.returnValue(of(brandingApi.snapshot as any));
    brandingService = jasmine.createSpyObj<JuliBrandingService>('JuliBrandingService', ['applyTenantTheme']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [AppComponent],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: JuliCartFacade, useValue: cartFacade },
        { provide: Title, useValue: titleService },
        { provide: TenantBrandingApiService, useValue: brandingApi },
        { provide: JuliBrandingService, useValue: brandingService }
      ],
      schemas: [NO_ERRORS_SCHEMA]
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
  });

  it('logs out without clearing the authenticated cart remotely', () => {
    component.logout();

    expect(authService.logout).toHaveBeenCalled();
    expect(cartFacade.clear).not.toHaveBeenCalled();
  });
});

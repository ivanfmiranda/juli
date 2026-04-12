import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TenantBrandingApiService } from '../tenant-branding-api.service';
import { TenantHostService } from '../tenant-host.service';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('TenantBrandingApiService', () => {
  let httpMock: HttpTestingController;
  let tenantHost: jasmine.SpyObj<TenantHostService>;
  let originalSsrBranding: any;

  beforeEach(() => {
    originalSsrBranding = (window as any).__TENANT_BRANDING__;
    delete (window as any).__TENANT_BRANDING__;

    tenantHost = jasmine.createSpyObj<TenantHostService>('TenantHostService', ['currentTenantId']);
    tenantHost.currentTenantId.and.returnValue('tenant-a');

    TestBed.configureTestingModule({
    imports: [],
    providers: [
        TenantBrandingApiService,
        { provide: TenantHostService, useValue: tenantHost },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});

    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();

    if (typeof originalSsrBranding === 'undefined') {
      delete (window as any).__TENANT_BRANDING__;
    } else {
      (window as any).__TENANT_BRANDING__ = originalSsrBranding;
    }
  });

  it('loads tenant branding from Strapi and updates the snapshot', (done) => {
    const service = TestBed.inject(TenantBrandingApiService);

    service.load().subscribe(config => {
      expect(config.tenantKey).toBe('tenant-a');
      expect(config.brandName).toBe('Tenant A');
      expect(config.logoUrl).toBe('/assets/tenant-a.svg');
      expect(config.theme['--brand-primary']).toBe('#112233');
      expect(config.navCategories[0].code).toBe('catalogo');
      expect(service.snapshot.brandName).toBe('Tenant A');
      done();
    });

    const req = httpMock.expectOne(request =>
      request.urlWithParams === '/strapi-api/tenant-brandings?filters[tenantKey]=tenant-a'
    );
    expect(req.request.method).toBe('GET');
    req.flush({
      data: [
        {
          attributes: {
            tenantKey: 'tenant-a',
            brandName: 'Tenant A',
            brandIcon: 'TA',
            logoUrl: '/assets/tenant-a.svg',
            theme: { '--brand-primary': '#112233' },
            navCategories: [{ code: 'catalogo', label: 'Catalogo', icon: 'A' }],
            footerLinks: {
              shop: [{ name: 'Shop', url: '/shop' }],
              support: [{ name: 'Support', url: '/support' }],
              company: [{ name: 'Company', url: '/company' }]
            },
            promoText: 'Oferta'
          }
        }
      ]
    });
  });

  it('falls back to the default branding when the API request fails', (done) => {
    const service = TestBed.inject(TenantBrandingApiService);

    service.load().subscribe(config => {
      expect(config.tenantKey).toBe('default');
      expect(config.brandName).toBe('JULI');
      expect(config.navCategories.length).toBeGreaterThan(0);
      expect(service.snapshot.tenantKey).toBe('default');
      done();
    });

    const req = httpMock.expectOne(request =>
      request.urlWithParams === '/strapi-api/tenant-brandings?filters[tenantKey]=tenant-a'
    );
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
  });

  it('uses SSR-injected branding for non-default tenants without performing HTTP requests', (done) => {
    (window as any).__TENANT_BRANDING__ = {
      tenantKey: 'tenant-b',
      brandName: 'Tenant B',
      brandIcon: 'TB',
      logoUrl: '/assets/tenant-b.svg',
      theme: { '--brand-primary': '#445566' },
      navCategories: [{ code: 'tenant-b', label: 'Tenant B', icon: 'B' }],
      footerLinks: {
        shop: [],
        support: [],
        company: []
      },
      promoText: 'SSR promo'
    };

    const service = TestBed.inject(TenantBrandingApiService);

    expect(service.snapshot.tenantKey).toBe('tenant-b');

    service.load().subscribe(config => {
      expect(config.tenantKey).toBe('tenant-b');
      expect(config.brandName).toBe('Tenant B');
      expect(config.promoText).toBe('SSR promo');
      done();
    });

    httpMock.expectNone(request => request.url.includes('/strapi-api/tenant-brandings'));
  });
});

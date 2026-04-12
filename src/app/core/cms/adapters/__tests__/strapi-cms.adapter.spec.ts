import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StrapiCmsAdapter } from '../strapi-cms.adapter';
import { JuliPageContext } from '../../types';
import { JuliI18nService } from '../../../i18n/i18n.service';
import { TenantHostService } from '../../../services/tenant-host.service';
import { PreviewTokenService } from '../../services/preview-token.service';

describe('StrapiCmsAdapter', () => {
  let adapter: StrapiCmsAdapter;
  let httpMock: HttpTestingController;

  const contentPageContext: JuliPageContext = {
    id: 'demo',
    type: 'ContentPage'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        StrapiCmsAdapter,
        {
          provide: JuliI18nService,
          useValue: {
            currentLocale: 'en-US',
            fallback: 'en-US',
            translate: (key: string) => key
          }
        },
        {
          provide: TenantHostService,
          useValue: {
            currentTenantId: () => 'default'
          }
        },
        {
          provide: PreviewTokenService,
          useValue: {
            getToken: () => null
          }
        }
      ]
    });

    adapter = TestBed.inject(StrapiCmsAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request the Strapi pages contract through /strapi-api/pages', (done) => {
    adapter.loadCanonical(contentPageContext).subscribe(page => {
      expect(page.label).toBe('demo');
      done();
    });

    const req = httpMock.expectOne(request =>
      request.urlWithParams.includes('/strapi-api/pages') &&
      request.urlWithParams.includes('demo')
    );
    expect(req.request.method).toBe('GET');
    req.flush(pageResponse({ slug: 'demo', title: 'Demo', content_slots: [] }));
  });

  it('should normalize hero banner data for the Angular component contract', (done) => {
    adapter.loadCanonical(contentPageContext).subscribe(page => {
      const component: any = page.regions?.['main']?.components?.[0];
      expect(component.typeCode).toBe('JuliHeroBannerComponent');
      expect(component.flexType).toBe('JuliHeroBannerComponent');
      expect(component.title).toBe('Welcome');
      expect(component.subtitle).toBe('Editorial subtitle');
      expect(component.ctaLabel).toBe('Shop now');
      expect(component.ctaLink).toBe('/products');
      expect(component.backgroundImageUrl).toBe('https://cdn.example/banner.jpg');
      expect(component.cta_label).toBeUndefined();
      expect(component.background_image).toBeUndefined();
      done();
    });

    httpMock.expectOne(anyPagesRequest()).flush(pageResponse({
      slug: 'demo',
      content_slots: [{
        id: 1,
        __component: 'cms.hero-banner',
        title: 'Welcome',
        subtitle: 'Editorial subtitle',
        cta_label: 'Shop now',
        cta_link: '/products',
        background_image: {
          data: {
            attributes: {
              url: 'https://cdn.example/banner.jpg'
            }
          }
        }
      }]
    }));
  });

  it('should normalize product teaser data for the Angular component contract', (done) => {
    adapter.loadCanonical(contentPageContext).subscribe(page => {
      const component: any = page.regions?.['main']?.components?.[0];
      expect(component.typeCode).toBe('JuliProductTeaserComponent');
      expect(component.productCode).toBe('3881010');
      expect(component.teaserText).toBe('Featured smartphone');
      expect(component.product_code).toBeUndefined();
      expect(component.teaser_text).toBeUndefined();
      done();
    });

    httpMock.expectOne(anyPagesRequest()).flush(pageResponse({
      slug: 'demo',
      content_slots: [{
        id: 7,
        __component: 'cms.product-teaser',
        product_code: '3881010',
        teaser_text: 'Featured smartphone'
      }]
    }));
  });

  it('should map canonical regions without breaking pages that only use main', (done) => {
    adapter.loadCanonical(contentPageContext).subscribe(page => {
      expect(page.regions?.['header']?.components?.length).toBe(1);
      expect(page.regions?.['main']?.components?.length).toBe(1);
      expect(page.regions?.['sidebar']?.components?.length).toBe(1);
      expect(page.regions?.['belowFold']?.components?.length).toBe(1);
      expect(page.regions?.['footer']?.components?.length).toBe(1);
      done();
    });

    httpMock.expectOne(anyPagesRequest()).flush(pageResponse({
      slug: 'demo',
      header_slots: [{ id: 1, __component: 'cms.info-card', title: 'Header card' }],
      content_slots: [{ id: 2, __component: 'cms.rich-text', content: '<p>Main</p>' }],
      sidebar_slots: [{ id: 3, __component: 'cms.simple-banner', title: 'Sidebar banner' }],
      below_fold_slots: [{ id: 4, __component: 'cms.cta-block', title: 'Below fold CTA', button_label: 'Explore', button_link: '/explore' }],
      footer_slots: [{ id: 5, __component: 'cms.category-teaser', category_code: '578' }]
    }));
  });

  it('should emit dedicated component type codes for CTA and category teasers', (done) => {
    adapter.loadCanonical(contentPageContext).subscribe(page => {
      const cta: any = page.regions?.['belowFold']?.components?.[0];
      const category: any = page.regions?.['footer']?.components?.[0];
      expect(cta.typeCode).toBe('JuliCtaBlockComponent');
      expect(category.typeCode).toBe('JuliCategoryTeaserComponent');
      expect(category.link).toBe('/c/578');
      done();
    });

    httpMock.expectOne(anyPagesRequest()).flush(pageResponse({
      slug: 'demo',
      below_fold_slots: [{ id: 4, __component: 'cms.cta-block', title: 'Below fold CTA', button_label: 'Explore', button_link: '/explore' }],
      footer_slots: [{ id: 5, __component: 'cms.category-teaser', category_code: '578' }]
    }));
  });

  it('should emit UnknownComponent for unsupported types', (done) => {
    adapter.loadCanonical(contentPageContext).subscribe(page => {
      const component: any = page.regions?.['main']?.components?.[0];
      expect(component.typeCode).toBe('UnknownComponent');
      expect(component.flexType).toBe('UnknownComponent');
      expect(component.originalType).toBe('unknown-widget');
      expect(component.status).toBe('unknown');
      done();
    });

    httpMock.expectOne(anyPagesRequest()).flush(pageResponse({
      slug: 'demo',
      content_slots: [{ id: 9, __component: 'cms.unknown-widget', title: 'Unsupported' }]
    }));
  });

  it('should emit ErrorComponent when __component is missing or malformed', (done) => {
    adapter.loadCanonical(contentPageContext).subscribe(page => {
      const component: any = page.regions?.['main']?.components?.[0];
      expect(component.typeCode).toBe('ErrorComponent');
      expect(component.status).toBe('invalid');
      expect(component.errorMessage).toContain('Component type is missing');
      done();
    });

    httpMock.expectOne(anyPagesRequest()).flush(pageResponse({
      slug: 'demo',
      content_slots: [{ id: 13, title: 'Broken payload' }]
    }));
  });

  it('should resolve loadComponent from the normalized page cache', (done) => {
    adapter.loadCanonical(contentPageContext).subscribe(page => {
      const component: any = page.regions?.['main']?.components?.[0];

      adapter.loadComponent(component.uid, contentPageContext).subscribe(loadedComponent => {
        expect((loadedComponent as any).typeCode).toBe('JuliHeroBannerComponent');
        expect((loadedComponent as any).ctaLabel).toBe('Open');
        done();
      });
    });

    httpMock.expectOne(anyPagesRequest()).flush(pageResponse({
      slug: 'demo',
      content_slots: [{
        id: 21,
        __component: 'cms.hero-banner',
        title: 'Cached hero',
        cta_label: 'Open'
      }]
    }));
  });

  it('should return ErrorComponent from loadComponent when the requested uid cannot be resolved', (done) => {
    adapter.loadComponent('missing-component', contentPageContext).subscribe(component => {
      expect((component as any).typeCode).toBe('ErrorComponent');
      expect((component as any).errorMessage).toContain('Component not found');
      done();
    });

    httpMock.expectOne(anyPagesRequest()).flush(pageResponse({
      slug: 'demo',
      content_slots: []
    }));
  });

  it('should return a safe error page when the CMS request fails', (done) => {
    adapter.loadCanonical(contentPageContext).subscribe(page => {
      expect(page.regions?.['main']?.components?.[0].typeCode).toBe('ErrorComponent');
      done();
    });

    const req = httpMock.expectOne(anyPagesRequest());
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
  });
});

function anyPagesRequest() {
  return (request: any) => request.urlWithParams.includes('/strapi-api/pages');
}

function pageResponse(attributes: Record<string, unknown>) {
  return {
    data: [
      {
        id: 1,
        attributes
      }
    ]
  };
}

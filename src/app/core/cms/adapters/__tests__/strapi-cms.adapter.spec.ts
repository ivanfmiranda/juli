import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PageContext, PageType } from '@spartacus/core';
import { StrapiCmsAdapter } from '../strapi-cms.adapter';

describe('StrapiCmsAdapter', () => {
  let adapter: StrapiCmsAdapter;
  let httpMock: HttpTestingController;

  const contentPageContext: PageContext = {
    id: 'demo',
    type: PageType.CONTENT_PAGE
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [StrapiCmsAdapter]
    });

    adapter = TestBed.inject(StrapiCmsAdapter);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should request the unified /api/pages contract', (done) => {
    adapter.load(contentPageContext).subscribe(page => {
      expect(page.page?.label).toBe('demo');
      done();
    });

    const req = httpMock.expectOne(request =>
      request.urlWithParams.includes('/api/pages') &&
      request.urlWithParams.includes('demo')
    );
    expect(req.request.method).toBe('GET');
    req.flush(pageResponse({ slug: 'demo', title: 'Demo', content_slots: [] }));
  });

  it('should normalize hero banner data for the Angular component contract', (done) => {
    adapter.load(contentPageContext).subscribe(page => {
      const component: any = page.page?.slots?.Section1?.components?.[0];
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
    adapter.load(contentPageContext).subscribe(page => {
      const component: any = page.page?.slots?.Section1?.components?.[0];
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

  it('should map canonical regions into Spartacus slots without breaking pages that only use main', (done) => {
    adapter.load(contentPageContext).subscribe(page => {
      expect(page.page?.slots?.Header?.components?.length).toBe(1);
      expect(page.page?.slots?.Section1?.components?.length).toBe(1);
      expect(page.page?.slots?.Sidebar?.components?.length).toBe(1);
      expect(page.page?.slots?.Section2?.components?.length).toBe(1);
      expect(page.page?.slots?.Footer?.components?.length).toBe(1);
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
    adapter.load(contentPageContext).subscribe(page => {
      const cta: any = page.page?.slots?.Section2?.components?.[0];
      const category: any = page.page?.slots?.Footer?.components?.[0];
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
    adapter.load(contentPageContext).subscribe(page => {
      const component: any = page.page?.slots?.Section1?.components?.[0];
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
    adapter.load(contentPageContext).subscribe(page => {
      const component: any = page.page?.slots?.Section1?.components?.[0];
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
    adapter.load(contentPageContext).subscribe(page => {
      const component: any = page.page?.slots?.Section1?.components?.[0];

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
    adapter.load(contentPageContext).subscribe(page => {
      expect(page.page?.slots?.Section1?.components?.[0].typeCode).toBe('ErrorComponent');
      done();
    });

    const req = httpMock.expectOne(anyPagesRequest());
    req.flush({ message: 'boom' }, { status: 500, statusText: 'Server Error' });
  });
});

function anyPagesRequest() {
  return (request: any) => request.urlWithParams.includes('/api/pages');
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

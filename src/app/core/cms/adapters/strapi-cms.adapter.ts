import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { CmsComponent, CmsStructureModel, Page, PageContext } from '@spartacus/core';
import {
  BannerData,
  CmsComponentData,
  CmsPage,
  CmsRegion,
  CmsRegionName,
  ContactFormData,
  FallbackComponentData,
  HeroBannerData,
  InfoCardData,
  ParagraphData,
  ProductGridData,
  ProductTeaserData,
  SeoMetadataModel
} from '../../models/cms.model';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { JuliI18nService } from '../../i18n/i18n.service';
import { TenantHostService } from '../../services/tenant-host.service';
import { PreviewTokenService } from '../services/preview-token.service';

type StrapiPageResponse = {
  data?: StrapiPageEntry[];
};

type StrapiPageEntry = {
  id?: number | string;
  attributes?: StrapiPageAttributes;
};

type StrapiPageAttributes = {
  title?: string;
  slug?: string;
  locale?: string;
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string;
    ogImage?: {
      data?: {
        attributes?: {
          url?: string;
        };
      };
    };
  };
  content_slots?: StrapiComponentPayload[];
  header_slots?: StrapiComponentPayload[];
  sidebar_slots?: StrapiComponentPayload[];
  below_fold_slots?: StrapiComponentPayload[];
  footer_slots?: StrapiComponentPayload[];
};

type StrapiComponentPayload = Record<string, unknown> & {
  id?: number | string;
  __component?: string;
};

const PAGE_ENDPOINT = '/pages';
const CANONICAL_REGION_ORDER: CmsRegionName[] = ['header', 'main', 'sidebar', 'belowFold', 'footer'];
const REGION_PATHS: Record<CmsRegionName, string> = {
  header: 'header_slots',
  main: 'content_slots',
  sidebar: 'sidebar_slots',
  belowFold: 'below_fold_slots',
  footer: 'footer_slots'
};
const REGION_SLOT_NAMES: Record<CmsRegionName, string> = {
  header: 'Header',
  main: 'Section1',
  sidebar: 'Sidebar',
  belowFold: 'Section2',
  footer: 'Footer'
};

@Injectable({
  providedIn: 'root'
})
export class StrapiCmsAdapter {
  private readonly strapiApiUrl = environment.strapiApiBaseUrl;
  private readonly componentIndex = new Map<string, CmsComponentData>();

  constructor(
    protected http: HttpClient,
    private readonly i18n: JuliI18nService,
    private readonly tenantHost: TenantHostService,
    private readonly previewTokenService: PreviewTokenService,
  ) {}

  load(pageContext: PageContext): Observable<CmsStructureModel> {
    return this.loadCanonical(pageContext).pipe(
      map(page => ({ page: this.mapToSpartacusPage(page) })),
      catchError(error => {
        const slug = this.normalizeSlug(pageContext);
        console.error('[StrapiCmsAdapter] Failed to load page', { slug, pageContext, error });
        return of({ page: this.mapToSpartacusPage(this.createErrorPage(slug, pageContext)) });
      })
    );
  }

  loadCanonical(pageContext: PageContext, preview: boolean = false): Observable<CmsPage> {
    const slug = this.normalizeSlug(pageContext);
    this.componentIndex.clear();

    return this.fetchLocalizedPage(slug, preview).pipe(
      map(response => this.mapToCanonicalPage(response, pageContext, slug)),
      catchError(error => {
        console.error('[StrapiCmsAdapter] Failed to load canonical page', { slug, pageContext, preview, error });
        return of(this.createErrorPage(slug, pageContext));
      })
    );
  }

  loadComponent<T extends CmsComponent = CmsComponentData>(id: string, pageContext: PageContext): Observable<T> {
    if (this.componentIndex.has(id)) {
      return of(this.componentIndex.get(id)! as unknown as T);
    }

    return this.loadCanonical(pageContext).pipe(
      map(() => (this.componentIndex.get(id) ?? this.createErrorComponent(id, 'Component not found in loaded CMS page')) as unknown as T)
    );
  }

  findComponentsByIds(ids: string[], pageContext: PageContext): Observable<CmsComponent[]> {
    return this.loadCanonical(pageContext).pipe(
      map(() => ids
        .map(id => this.componentIndex.get(id))
        .filter((component): component is CmsComponentData => component !== undefined)
      )
    );
  }

  private mapToCanonicalPage(response: StrapiPageResponse | null | undefined, pageContext: PageContext, requestedSlug: string): CmsPage {
    const entry = response?.data?.[0];
    const attributes = entry?.attributes ?? {};
    const label = this.valueOrFallback(attributes.slug, requestedSlug);

    const page: CmsPage = {
      uid: `page-${label}`,
      label,
      title: this.optionalString(attributes.title),
      template: 'LandingPage2Template',
      type: String(pageContext.type ?? 'ContentPage'),
      found: !!entry,
      locale: this.valueOrFallback(attributes.locale, this.i18n.currentLocale),
      seo: this.mapSeo(attributes.seo),
      regions: this.mapRegions(attributes)
    };

    this.indexPageComponents(page);
    return page;
  }

  private mapRegions(attributes: StrapiPageAttributes): Record<string, CmsRegion> {
    const regions = {} as Record<string, CmsRegion>;

    for (const regionName of CANONICAL_REGION_ORDER) {
      const path = REGION_PATHS[regionName] as keyof StrapiPageAttributes;
      const rawComponents = this.asComponentList(attributes[path]);
      const components = rawComponents
        .map((component, index) => this.mapComponent(component, regionName, index))
        .filter((component): component is CmsComponentData => component !== null)
        .sort((left, right) => (left.order ?? 0) - (right.order ?? 0));

      regions[regionName] = {
        uid: `region-${regionName}`,
        name: regionName,
        components
      };
    }

    return regions;
  }

  private mapComponent(component: StrapiComponentPayload | null | undefined, regionName: CmsRegionName, index: number): CmsComponentData | null {
    if (!component || typeof component !== 'object') {
      console.warn('[StrapiCmsAdapter] Invalid component payload', { regionName, index, component });
      return this.createErrorComponent(this.buildComponentUid(regionName, component, index), 'Invalid CMS component payload');
    }

    const componentType = this.extractComponentType(component.__component);
    if (!componentType) {
      console.warn('[StrapiCmsAdapter] Missing or invalid __component', { regionName, index, component });
      return this.createErrorComponent(this.buildComponentUid(regionName, component, index), 'Component type is missing');
    }

    switch (componentType) {
      case 'hero-banner':
        return this.mapHeroBanner(component, regionName, index);
      case 'simple-banner':
        return this.mapBanner(component, regionName, index, 'JuliSimpleBannerComponent');
      case 'cta-block':
        return this.mapBanner(component, regionName, index, 'JuliCtaBlockComponent');
      case 'category-teaser':
        return this.mapCategoryBanner(component, regionName, index);
      case 'rich-text':
        return this.mapParagraph(component, regionName, index);
      case 'product-teaser':
        return this.mapProductTeaser(component, regionName, index);
      case 'product-grid':
        return this.mapProductGrid(component, regionName, index);
      case 'info-card':
        return this.mapInfoCard(component, regionName, index);
      case 'contact-form':
        return this.mapContactForm(component, regionName, index);
      default:
        console.warn('[StrapiCmsAdapter] Unsupported component type', { regionName, index, componentType });
        return this.createUnknownComponent(this.buildComponentUid(regionName, component, index), componentType, regionName);
    }
  }

  private mapHeroBanner(component: StrapiComponentPayload, regionName: CmsRegionName, index: number): HeroBannerData {
    return {
      uid: this.buildComponentUid(regionName, component, index),
      typeCode: 'JuliHeroBannerComponent',
      flexType: 'JuliHeroBannerComponent',
      region: regionName,
      originalType: 'hero-banner',
      order: this.optionalNumber(component.order),
      status: 'ready',
      title: this.optionalString(component.title),
      subtitle: this.optionalString(component.subtitle),
      ctaLabel: this.optionalString(component.cta_label),
      ctaLink: this.optionalString(component.cta_link),
      backgroundImageUrl: this.extractImageUrl(component.background_image) ?? this.extractImageUrl(component.image_url)
    };
  }

  private mapBanner(
    component: StrapiComponentPayload,
    regionName: CmsRegionName,
    index: number,
    typeCode: string
  ): BannerData {
    return {
      uid: this.buildComponentUid(regionName, component, index),
      typeCode,
      flexType: typeCode,
      region: regionName,
      originalType: this.extractComponentType(component.__component) ?? 'banner',
      order: this.optionalNumber(component.order),
      status: 'ready',
      title: this.optionalString(component.title),
      description: this.optionalString(component.description) ?? this.optionalString(component.subtitle),
      imageUrl: this.extractImageUrl(component.image) ?? this.extractImageUrl(component.background_image) ?? this.extractImageUrl(component.image_url),
      link: this.optionalString(component.link) ?? this.optionalString(component.button_link),
      buttonLabel: this.optionalString(component.button_label) ?? this.optionalString(component.cta_label),
      buttonLink: this.optionalString(component.button_link) ?? this.optionalString(component.link) ?? this.optionalString(component.cta_link)
    };
  }

  private mapCategoryBanner(component: StrapiComponentPayload, regionName: CmsRegionName, index: number): BannerData {
    const categoryCode = this.optionalString(component.category_code);
    return {
      uid: this.buildComponentUid(regionName, component, index),
      typeCode: 'JuliCategoryTeaserComponent',
      flexType: 'JuliCategoryTeaserComponent',
      region: regionName,
      originalType: 'category-teaser',
      order: this.optionalNumber(component.order),
      status: 'ready',
      title: this.optionalString(component.title) ?? (categoryCode ? `Category ${categoryCode}` : 'Category'),
      description: this.optionalString(component.description),
      imageUrl: this.extractImageUrl(component.teaser_image) ?? this.extractImageUrl(component.image_url),
      link: categoryCode ? `/c/${categoryCode}` : undefined,
      buttonLabel: this.i18n.translate('commerce.browseCategory'),
      buttonLink: categoryCode ? `/c/${categoryCode}` : undefined
    };
  }

  private mapParagraph(component: StrapiComponentPayload, regionName: CmsRegionName, index: number): ParagraphData {
    return {
      uid: this.buildComponentUid(regionName, component, index),
      typeCode: 'CMSParagraphComponent',
      flexType: 'CMSParagraphComponent',
      region: regionName,
      originalType: 'rich-text',
      order: this.optionalNumber(component.order),
      status: 'ready',
      content: this.optionalString(component.content) ?? ''
    };
  }

  private mapProductTeaser(component: StrapiComponentPayload, regionName: CmsRegionName, index: number): ProductTeaserData {
    return {
      uid: this.buildComponentUid(regionName, component, index),
      typeCode: 'JuliProductTeaserComponent',
      flexType: 'JuliProductTeaserComponent',
      region: regionName,
      originalType: 'product-teaser',
      order: this.optionalNumber(component.order),
      status: 'ready',
      productCode: this.optionalString(component.product_code),
      teaserText: this.optionalString(component.teaser_text)
    };
  }

  private mapProductGrid(component: StrapiComponentPayload, regionName: CmsRegionName, index: number): ProductGridData {
    return {
      uid: this.buildComponentUid(regionName, component, index),
      typeCode: 'JuliProductGridComponent',
      flexType: 'JuliProductGridComponent',
      region: regionName,
      originalType: 'product-grid',
      order: this.optionalNumber(component.order),
      status: 'ready',
      title: this.optionalString(component.title),
      subtitle: this.optionalString(component.subtitle),
      categoryCode: this.optionalString(component.category_code),
      searchQuery: this.optionalString(component.search_query),
      productCodes: this.asStringList(component.product_codes),
      pageSize: this.optionalNumber(component.page_size) ?? 4,
      ctaLabel: this.optionalString(component.cta_label),
      ctaLink: this.optionalString(component.cta_link)
    };
  }

  private mapInfoCard(component: StrapiComponentPayload, regionName: CmsRegionName, index: number): InfoCardData {
    return {
      uid: this.buildComponentUid(regionName, component, index),
      typeCode: 'JuliInfoCardComponent',
      flexType: 'JuliInfoCardComponent',
      region: regionName,
      originalType: 'info-card',
      order: this.optionalNumber(component.order),
      status: 'ready',
      icon: this.optionalString(component.icon),
      title: this.optionalString(component.title),
      description: this.optionalString(component.description),
      link: this.optionalString(component.link)
    };
  }

  private mapContactForm(component: StrapiComponentPayload, regionName: CmsRegionName, index: number): ContactFormData {
    return {
      uid: this.buildComponentUid(regionName, component, index),
      typeCode: 'JuliContactFormComponent',
      flexType: 'JuliContactFormComponent',
      region: regionName,
      originalType: 'contact-form',
      order: this.optionalNumber(component.order),
      status: 'ready',
      title: this.optionalString(component.title),
      description: this.optionalString(component.description),
      buttonLabel: this.optionalString(component.button_label) ?? this.optionalString(component.buttonLabel) ?? this.i18n.translate('footer.newsletterButton'),
      successMessage: this.optionalString(component.success_message) ?? this.optionalString(component.successMessage) ?? 'Thank you! Your message has been sent.'
    };
  }

  private mapToSpartacusPage(page: CmsPage): Page {
    return {
      label: page.label,
      title: page.title,
      type: page.type as any,
      template: page.template,
      slots: Object.entries(page.regions).reduce((slots, [regionName, region]) => {
        const slotName = REGION_SLOT_NAMES[regionName as CmsRegionName] ?? regionName;
        slots[slotName] = {
          components: region.components
        };
        return slots;
      }, {} as Record<string, { components: CmsComponentData[] }>)
    };
  }

  private mapSeo(seo: StrapiPageAttributes['seo']): SeoMetadataModel | undefined {
    if (!seo) {
      return undefined;
    }

    return {
      title: this.optionalString(seo.metaTitle),
      description: this.optionalString(seo.metaDescription),
      keywords: this.optionalString(seo.keywords),
      ogImage: this.extractImageUrl(seo.ogImage)
    };
  }

  private indexPageComponents(page: CmsPage): void {
    this.componentIndex.clear();

    Object.values(page.regions).forEach(region => {
      region.components.forEach(component => this.componentIndex.set(component.uid, component));
    });
  }

  private createErrorPage(slug: string, pageContext: PageContext): CmsPage {
    const errorComponent = this.createErrorComponent(`error-${slug}`, 'Failed to load CMS page');
    return {
      uid: `page-${slug}`,
      label: slug,
      title: slug,
      template: 'LandingPage2Template',
      type: String(pageContext.type ?? 'ContentPage'),
      found: false,
      regions: {
        header: { uid: 'region-header', name: 'header', components: [] },
        main: { uid: 'region-main', name: 'main', components: [errorComponent] },
        sidebar: { uid: 'region-sidebar', name: 'sidebar', components: [] },
        belowFold: { uid: 'region-belowFold', name: 'belowFold', components: [] },
        footer: { uid: 'region-footer', name: 'footer', components: [] }
      }
    };
  }

  private createUnknownComponent(uid: string, originalType: string, regionName: string): FallbackComponentData {
    return {
      uid,
      typeCode: 'UnknownComponent',
      flexType: 'UnknownComponent',
      region: regionName,
      originalType,
      status: 'unknown',
      message: `Component type "${originalType}" is not supported by the current registry`
    };
  }

  private createErrorComponent(uid: string, errorMessage: string): FallbackComponentData {
    return {
      uid,
      typeCode: 'ErrorComponent',
      flexType: 'ErrorComponent',
      status: 'invalid',
      errorMessage
    };
  }

  private buildComponentUid(regionName: string, component: StrapiComponentPayload | null | undefined, index: number): string {
    const componentId = component?.id ?? index;
    return `${regionName}-${componentId}`;
  }

  private pageUrl(slug: string, preview: boolean): string {
    return this.pageUrlForLocale(slug, this.i18n.currentLocale, preview);
  }

  private pageUrlForLocale(slug: string, locale: string, preview: boolean): string {
    const previewParams = preview ? '&publicationState=preview' : '';
    const tenantFilter = this.tenantFilterQuery();
    // populate=* only goes one level deep in Strapi v4; media inside dynamic zone
    // components (e.g. backgroundImage on hero-banner) is not populated.
    // Use explicit nested populate so every slot's component fields are fully resolved.
    const populate = [
      'populate[content_slots][populate]=*',
      'populate[header_slots][populate]=*',
      'populate[sidebar_slots][populate]=*',
      'populate[below_fold_slots][populate]=*',
      'populate[footer_slots][populate]=*',
      'populate[seo]=*'
    ].join('&');
    const localeQuery = locale ? `&locale=${encodeURIComponent(locale)}` : '';
    return `${this.strapiApiUrl}${PAGE_ENDPOINT}?filters[slug][$eq]=${encodeURIComponent(slug)}${tenantFilter}&${populate}${localeQuery}${previewParams}`;
  }

  private tenantFilterQuery(): string {
    const tenantId = this.tenantHost.currentTenantId();
    if (!tenantId || tenantId === 'default') {
      return '';
    }
    return `&filters[tenantKey][$eq]=${encodeURIComponent(tenantId)}`;
  }

  private fetchLocalizedPage(slug: string, preview: boolean): Observable<StrapiPageResponse> {
    const primaryLocale = this.i18n.currentLocale;
    const fallbackLocale = this.i18n.fallback;
    const headers = this.buildPreviewHeaders(preview);

    return this.http.get<StrapiPageResponse>(this.pageUrlForLocale(slug, primaryLocale, preview), { headers }).pipe(
      switchMap(response => {
        if (response?.data?.length || fallbackLocale === primaryLocale) {
          return of(response);
        }
        return this.http.get<StrapiPageResponse>(this.pageUrlForLocale(slug, fallbackLocale, preview), { headers });
      })
    );
  }

  private buildPreviewHeaders(preview: boolean): HttpHeaders {
    if (!preview) {
      return new HttpHeaders();
    }
    const token = this.previewTokenService.getToken();
    return token
      ? new HttpHeaders({ Authorization: `Bearer ${token}` })
      : new HttpHeaders();
  }

  private normalizeSlug(pageContext: PageContext): string {
    const rawId = pageContext?.id ? String(pageContext.id) : 'home';
    return rawId === 'homepage' ? 'home' : rawId;
  }

  private extractComponentType(rawType: unknown): string | null {
    if (typeof rawType !== 'string' || !rawType.includes('.')) {
      return null;
    }
    const [, componentType] = rawType.split('.', 2);
    return componentType || null;
  }

  private extractImageUrl(candidate: unknown): string | undefined {
    // Accept plain string URLs (e.g. image_url field from the visual editor)
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    }
    if (!candidate || typeof candidate !== 'object') {
      return undefined;
    }

    const directUrl = this.optionalString((candidate as Record<string, unknown>).url);
    if (directUrl) {
      return directUrl;
    }

    const data = (candidate as Record<string, unknown>).data as Record<string, unknown> | undefined;
    const attributes = data?.attributes as Record<string, unknown> | undefined;
    return this.optionalString(attributes?.url);
  }

  private asComponentList(candidate: unknown): StrapiComponentPayload[] {
    if (!Array.isArray(candidate)) {
      return [];
    }
    return candidate.filter(item => item && typeof item === 'object') as StrapiComponentPayload[];
  }

  private optionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private optionalNumber(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'string' && value.trim()) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }
    return undefined;
  }

  private asStringList(candidate: unknown): string[] {
    if (!Array.isArray(candidate)) {
      return [];
    }
    return candidate
      .map(item => this.optionalString(item))
      .filter((item): item is string => !!item);
  }

  private valueOrFallback(value: string | undefined, fallback: string): string {
    return value && value.trim().length > 0 ? value.trim() : fallback;
  }
}

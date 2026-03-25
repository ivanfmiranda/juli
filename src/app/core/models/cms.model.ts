/**
 * Juli CMS canonical UI contract.
 *
 * These types are intentionally independent from Strapi payload details.
 * The adapter is responsible for translating external content into this model
 * before anything reaches Spartacus components.
 */

export type CmsRegionName = 'header' | 'main' | 'sidebar' | 'belowFold' | 'footer';

export interface CmsPage {
  uid: string;
  label: string;
  title?: string;
  template: string;
  type?: string;
  found?: boolean;
  regions: Record<string, CmsRegion>;
  seo?: SeoMetadataModel;
}

export interface CmsRegion {
  uid: string;
  name: CmsRegionName | string;
  components: CmsComponentData[];
}

export interface CmsComponentData {
  uid: string;
  typeCode: string;
  flexType: string;
  region?: string;
  originalType?: string;
  status?: 'ready' | 'unknown' | 'invalid';
  name?: string;
}

export interface HeroBannerData extends CmsComponentData {
  title?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaLink?: string;
  backgroundImageUrl?: string;
}

export interface ProductTeaserData extends CmsComponentData {
  productCode?: string;
  teaserText?: string;
}

export interface ParagraphData extends CmsComponentData {
  content?: string;
}

export interface BannerData extends CmsComponentData {
  title?: string;
  description?: string;
  imageUrl?: string;
  link?: string;
  buttonLabel?: string;
  buttonLink?: string;
}

export interface InfoCardData extends CmsComponentData {
  icon?: string;
  title?: string;
  description?: string;
  link?: string;
}

export interface ContactFormData extends CmsComponentData {
  title?: string;
  description?: string;
  buttonLabel?: string;
  successMessage?: string;
}

export interface FallbackComponentData extends CmsComponentData {
  message?: string;
  errorMessage?: string;
  rawPayload?: unknown;
}

export interface SeoMetadataModel {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
}

// Backward-compatible aliases for existing component imports.
export type CmsSlot = CmsRegion;
export type CmsComponent = CmsComponentData;
export type HeroBannerComponentModel = HeroBannerData;
export type SimpleBannerComponentModel = BannerData;
export type RichTextComponentModel = ParagraphData;
export type CtaBlockComponentModel = BannerData;
export type ProductTeaserComponentModel = ProductTeaserData;
export type CategoryTeaserComponentModel = BannerData;
export type InfoCardComponentModel = InfoCardData;
export type ContactFormComponentModel = ContactFormData;

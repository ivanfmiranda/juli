import type { Schema, Attribute } from '@strapi/strapi';

export interface CmsCategoryTeaser extends Schema.Component {
  collectionName: 'components_cms_category_teasers';
  info: {
    displayName: 'Category Teaser';
    icon: 'folder';
    description: 'A category preview card linking into the product catalogue';
  };
  attributes: {
    title: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    description: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    category_code: Attribute.String;
    teaser_image: Attribute.Media<'images'>;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface CmsContactForm extends Schema.Component {
  collectionName: 'components_cms_contact_forms';
  info: {
    displayName: 'Contact Form';
    icon: 'mail';
    description: 'A contact form component for customers to send messages';
  };
  attributes: {
    title: Attribute.String;
    description: Attribute.Text;
    buttonLabel: Attribute.String & Attribute.DefaultTo<'Send Message'>;
    successMessage: Attribute.String &
      Attribute.DefaultTo<'Thank you! Your message has been sent.'>;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface CmsCtaBanner extends Schema.Component {
  collectionName: 'components_cms_cta_banners';
  info: {
    displayName: 'CTA Banner';
    icon: 'cursor';
    description: 'Full-width call-to-action banner with title, subtitle and a button';
  };
  attributes: {
    title: Attribute.String & Attribute.Required;
    subtitle: Attribute.String;
    buttonText: Attribute.String;
    buttonLink: Attribute.String;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface CmsCtaBlock extends Schema.Component {
  collectionName: 'components_cms_cta_blocks';
  info: {
    displayName: 'CTA Block';
    icon: 'cursor';
    description: 'A call-to-action block with title, description and a button';
  };
  attributes: {
    title: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    description: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    button_label: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    button_link: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    image: Attribute.Media<'images'>;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface CmsFeatureItem extends Schema.Component {
  collectionName: 'components_cms_feature_items';
  info: {
    displayName: 'Feature Item';
    icon: 'star';
    description: 'A single feature entry within a Feature List';
  };
  attributes: {
    title: Attribute.String;
    icon: Attribute.String;
    description: Attribute.Text;
  };
}

export interface CmsFeatureList extends Schema.Component {
  collectionName: 'components_cms_feature_lists';
  info: {
    displayName: 'Feature List';
    icon: 'bulletList';
    description: 'A list of features, each with a title, icon and description';
  };
  attributes: {
    order: Attribute.Integer & Attribute.DefaultTo<0>;
    features: Attribute.Component<'cms.feature-item', true>;
  };
}

export interface CmsGridItem extends Schema.Component {
  collectionName: 'components_cms_grid_items';
  info: {
    displayName: 'Grid Item';
    icon: 'apps';
    description: 'A single cell within a Grid component';
  };
  attributes: {
    title: Attribute.String;
    description: Attribute.Text;
    icon: Attribute.String;
    image: Attribute.Media<'images'>;
    link: Attribute.String;
    buttonLabel: Attribute.String;
  };
}

export interface CmsGrid extends Schema.Component {
  collectionName: 'components_cms_grids';
  info: {
    displayName: 'Grid';
    icon: 'apps';
    description: 'A multi-column grid of cards or items';
  };
  attributes: {
    columns: Attribute.Enumeration<['2', '3', '4']> & Attribute.DefaultTo<'3'>;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
    items: Attribute.Component<'cms.grid-item', true>;
  };
}

export interface CmsHeroBanner extends Schema.Component {
  collectionName: 'components_cms_hero_banners';
  info: {
    displayName: 'Hero Banner';
    icon: 'image';
    description: 'Full-width hero banner with background image, title, subtitle and CTA';
  };
  attributes: {
    title: Attribute.String &
      Attribute.Required &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    subtitle: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    cta_label: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    cta_link: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    background_image: Attribute.Media<'images'> &
      Attribute.Required &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface CmsInfoCard extends Schema.Component {
  collectionName: 'components_cms_info_cards';
  info: {
    displayName: 'Info Card';
    icon: 'information';
    description: 'A small card with icon, title, description and optional link';
  };
  attributes: {
    icon: Attribute.String;
    title: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    description: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    link: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface CmsProductGrid extends Schema.Component {
  collectionName: 'components_cms_product_grids';
  info: {
    displayName: 'Product Grid';
    icon: 'shoppingCart';
    description: 'Editorial product grid linked to catalog products, categories or search';
  };
  attributes: {
    title: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    subtitle: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    product_codes: Attribute.JSON;
    category_code: Attribute.String;
    search_query: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    page_size: Attribute.Integer & Attribute.DefaultTo<4>;
    cta_label: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    cta_link: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface CmsProductTeaser extends Schema.Component {
  collectionName: 'components_cms_product_teasers';
  info: {
    displayName: 'Product Teaser';
    icon: 'shoppingCart';
    description: 'Renders a product preview card from the commerce catalogue';
  };
  attributes: {
    product_code: Attribute.String & Attribute.Required;
    teaser_text: Attribute.Text;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface CmsRichSection extends Schema.Component {
  collectionName: 'components_cms_rich_sections';
  info: {
    displayName: 'Rich Section';
    icon: 'layout';
    description: 'A section with a title, rich text body, optional image and configurable alignment';
  };
  attributes: {
    title: Attribute.String;
    content: Attribute.RichText;
    image: Attribute.Media<'images'>;
    alignment: Attribute.Enumeration<['left', 'right', 'center']> &
      Attribute.DefaultTo<'left'>;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface CmsRichText extends Schema.Component {
  collectionName: 'components_cms_rich_texts';
  info: {
    displayName: 'Rich Text';
    icon: 'paragraph';
    description: 'A block of rich text content (Markdown/WYSIWYG)';
  };
  attributes: {
    content: Attribute.RichText &
      Attribute.Required &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface CmsSectionContainer extends Schema.Component {
  collectionName: 'components_cms_section_containers';
  info: {
    displayName: 'Section Container';
    icon: 'layer';
    description: 'Visual section wrapper \u2014 sets a title, subtitle and background colour for a page section';
  };
  attributes: {
    title: Attribute.String;
    subtitle: Attribute.String;
    backgroundColor: Attribute.String & Attribute.DefaultTo<'#ffffff'>;
    anchor: Attribute.String;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface CmsSimpleBanner extends Schema.Component {
  collectionName: 'components_cms_simple_banners';
  info: {
    displayName: 'Simple Banner';
    icon: 'landscape';
    description: 'A banner with title, description, image and optional CTA link';
  };
  attributes: {
    title: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    description: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    image: Attribute.Media<'images'>;
    link: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    button_label: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    button_link: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    order: Attribute.Integer & Attribute.DefaultTo<0>;
  };
}

export interface SharedSeoMetadata extends Schema.Component {
  collectionName: 'components_shared_seo_metadata';
  info: {
    displayName: 'SEO Metadata';
    icon: 'search';
    description: '';
  };
  attributes: {
    metaTitle: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    metaDescription: Attribute.Text &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    keywords: Attribute.String &
      Attribute.SetPluginOptions<{
        i18n: {
          localized: true;
        };
      }>;
    ogImage: Attribute.Media<'images'>;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'cms.category-teaser': CmsCategoryTeaser;
      'cms.contact-form': CmsContactForm;
      'cms.cta-banner': CmsCtaBanner;
      'cms.cta-block': CmsCtaBlock;
      'cms.feature-item': CmsFeatureItem;
      'cms.feature-list': CmsFeatureList;
      'cms.grid-item': CmsGridItem;
      'cms.grid': CmsGrid;
      'cms.hero-banner': CmsHeroBanner;
      'cms.info-card': CmsInfoCard;
      'cms.product-grid': CmsProductGrid;
      'cms.product-teaser': CmsProductTeaser;
      'cms.rich-section': CmsRichSection;
      'cms.rich-text': CmsRichText;
      'cms.section-container': CmsSectionContainer;
      'cms.simple-banner': CmsSimpleBanner;
      'shared.seo-metadata': SharedSeoMetadata;
    }
  }
}

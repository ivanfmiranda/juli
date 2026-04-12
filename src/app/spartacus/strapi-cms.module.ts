import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JuliI18nModule } from '../core/i18n/i18n.module';
import { JULI_CMS_COMPONENT_REGISTRY } from '../core/cms/tokens';

// Components
import { HeroBannerComponent } from '../shared/components/hero-banner/hero-banner.component';
import { InfoCardComponent } from '../shared/components/info-card/info-card.component';
import { ProductTeaserComponent } from '../shared/components/product-teaser/product-teaser.component';
import { ParagraphComponent } from '../shared/components/paragraph/paragraph.component';
import { SimpleBannerComponent } from '../shared/components/simple-banner/simple-banner.component';
import { CategoryTeaserComponent } from '../shared/components/category-teaser/category-teaser.component';
import { CtaBlockComponent } from '../shared/components/cta-block/cta-block.component';
import { ContactFormComponent } from '../shared/components/contact-form/contact-form.component';
import { ProductGridComponent } from '../shared/components/product-grid/product-grid.component';

// Fallback Components
import {
  UnknownComponent,
  ErrorComponent,
  EmptyStateComponent,
  LoadingStateRenderer,
  NotFoundPageComponent
} from '../core/cms/fallback';

export const CMS_COMPONENT_REGISTRY = {
  JuliHeroBannerComponent: {
    component: HeroBannerComponent
  },
  JuliSimpleBannerComponent: {
    component: SimpleBannerComponent
  },
  JuliCategoryTeaserComponent: {
    component: CategoryTeaserComponent
  },
  JuliCtaBlockComponent: {
    component: CtaBlockComponent
  },
  CMSParagraphComponent: {
    component: ParagraphComponent
  },
  JuliProductTeaserComponent: {
    component: ProductTeaserComponent
  },
  JuliProductGridComponent: {
    component: ProductGridComponent
  },
  JuliInfoCardComponent: {
    component: InfoCardComponent
  },
  JuliContactFormComponent: {
    component: ContactFormComponent
  },
  UnknownComponent: {
    component: UnknownComponent
  },
  ErrorComponent: {
    component: ErrorComponent
  },
  EmptyState: {
    component: EmptyStateComponent
  },
  LoadingState: {
    component: LoadingStateRenderer
  }
};

/**
 * Strapi CMS Module
 *
 * Centraliza o registro de todos os componentes CMS e o adapter.
 * Este é o ponto único de configuração para o CMS.
 */
@NgModule({
  imports: [
    CommonModule,
    JuliI18nModule,
    RouterModule
  ],
  providers: [
    { provide: JULI_CMS_COMPONENT_REGISTRY, useValue: CMS_COMPONENT_REGISTRY }
  ],
  declarations: [
    // Componentes
    HeroBannerComponent,
    InfoCardComponent,
    ProductTeaserComponent,
    ProductGridComponent,
    ParagraphComponent,
    SimpleBannerComponent,
    CategoryTeaserComponent,
    CtaBlockComponent,
    ContactFormComponent,

    // Fallbacks
    UnknownComponent,
    ErrorComponent,
    EmptyStateComponent,
    LoadingStateRenderer,
    NotFoundPageComponent
  ],
  exports: [
    // Exporta para uso em outros módulos se necessário
    InfoCardComponent,
    ProductTeaserComponent,
    ProductGridComponent,
    ParagraphComponent,
    SimpleBannerComponent,
    CategoryTeaserComponent,
    CtaBlockComponent,
    UnknownComponent,
    ErrorComponent,
    NotFoundPageComponent
  ]
})
export class StrapiCmsModule {}

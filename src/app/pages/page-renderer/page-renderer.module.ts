import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { JuliI18nModule } from '../../core/i18n/i18n.module';
import { ProductCardModule } from '../../shared/components/product-card/product-card.module';
import { PageRendererComponent } from './page-renderer.component';
import { BannerBlockComponent } from './blocks/banner-block.component';
import { TextBlockComponent } from './blocks/text-block.component';
import { ProductGridBlockComponent } from './blocks/product-grid-block.component';
import { CarouselBlockComponent } from './blocks/carousel-block.component';
import { HtmlBlockComponent } from './blocks/html-block.component';
import { SpacerBlockComponent } from './blocks/spacer-block.component';
import { VideoBlockComponent } from './blocks/video-block.component';
import { FormBlockComponent } from './blocks/form-block.component';
import { MapBlockComponent } from './blocks/map-block.component';
import { ProductCarouselBlockComponent } from './blocks/product-carousel-block.component';
import { CategoryHeaderBlockComponent } from './blocks/category-header-block.component';
import { ProductListingBlockComponent } from './blocks/product-listing-block.component';
import { ProductDetailBlockComponent } from './blocks/product-detail-block.component';
import { ProductRelatedBlockComponent } from './blocks/product-related-block.component';
import { ProductReviewsBlockComponent } from './blocks/product-reviews-block.component';
import { SearchHeaderBlockComponent } from './blocks/search-header-block.component';

@NgModule({
  declarations: [
    PageRendererComponent,
    BannerBlockComponent,
    TextBlockComponent,
    ProductGridBlockComponent,
    CarouselBlockComponent,
    HtmlBlockComponent,
    SpacerBlockComponent,
    VideoBlockComponent,
    FormBlockComponent,
    MapBlockComponent,
    ProductCarouselBlockComponent,
    CategoryHeaderBlockComponent,
    ProductListingBlockComponent,
    ProductDetailBlockComponent,
    ProductRelatedBlockComponent,
    ProductReviewsBlockComponent,
    SearchHeaderBlockComponent,
  ],
  exports: [PageRendererComponent],
  imports: [CommonModule, FormsModule, RouterModule, JuliI18nModule, ProductCardModule],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class PageRendererModule {}

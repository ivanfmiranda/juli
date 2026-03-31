import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
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
  ],
  imports: [CommonModule, HttpClientModule, FormsModule],
  exports: [PageRendererComponent],
})
export class PageRendererModule {}

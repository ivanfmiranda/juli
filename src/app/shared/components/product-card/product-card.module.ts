import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { JuliI18nModule } from '../../../core/i18n/i18n.module';
import { IconComponent } from '../icon/icon.component';
import { ProductCardComponent } from './product-card.component';

@NgModule({
  declarations: [ProductCardComponent],
  imports: [CommonModule, RouterModule, JuliI18nModule, IconComponent],
  exports: [ProductCardComponent],
})
export class ProductCardModule {}

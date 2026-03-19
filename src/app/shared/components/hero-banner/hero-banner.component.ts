import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CmsComponentData } from '@spartacus/storefront';
import { HeroBannerComponentModel } from '../../../core/models/cms.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-hero-banner',
  templateUrl: './hero-banner.component.html',
  styleUrls: ['./hero-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroBannerComponent {
  data$: Observable<HeroBannerComponentModel> = this.componentData.data$;

  constructor(protected componentData: CmsComponentData<HeroBannerComponentModel>) {}
}

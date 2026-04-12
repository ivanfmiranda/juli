import { Component, ChangeDetectionStrategy, Inject, Optional } from '@angular/core';
import { HeroBannerComponentModel } from '../../../core/models/cms.model';
import { JULI_CMS_COMPONENT_DATA, JuliCmsComponentContext } from '../../../core/cms/tokens';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-hero-banner',
  templateUrl: './hero-banner.component.html',
  styleUrls: ['./hero-banner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HeroBannerComponent {
  data$: Observable<HeroBannerComponentModel> = this.componentData.data$;

  constructor(@Optional() @Inject(JULI_CMS_COMPONENT_DATA) protected componentData: JuliCmsComponentContext<HeroBannerComponentModel>) {}
}

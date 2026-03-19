import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CmsComponentData } from '@spartacus/storefront';
import { Observable } from 'rxjs';
import { BannerData } from '../../../core/models/cms.model';

@Component({
  selector: 'app-simple-banner',
  templateUrl: './simple-banner.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SimpleBannerComponent {
  data$: Observable<BannerData> = this.componentData.data$;

  constructor(protected componentData: CmsComponentData<BannerData>) {}
}

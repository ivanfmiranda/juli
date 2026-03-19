import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CmsComponentData } from '@spartacus/storefront';
import { Observable } from 'rxjs';
import { BannerData } from '../../../core/models/cms.model';

@Component({
  selector: 'app-cta-block',
  templateUrl: './cta-block.component.html',
  styleUrls: ['./cta-block.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CtaBlockComponent {
  data$: Observable<BannerData> = this.componentData.data$;

  constructor(protected componentData: CmsComponentData<BannerData>) {}
}
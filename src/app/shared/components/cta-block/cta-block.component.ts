import { ChangeDetectionStrategy, Component, Inject, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import { BannerData } from '../../../core/models/cms.model';
import { JULI_CMS_COMPONENT_DATA, JuliCmsComponentContext } from '../../../core/cms/tokens';

@Component({
  selector: 'app-cta-block',
  templateUrl: './cta-block.component.html',
  styleUrls: ['./cta-block.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CtaBlockComponent {
  data$: Observable<BannerData> = this.componentData.data$;

  constructor(@Optional() @Inject(JULI_CMS_COMPONENT_DATA) protected componentData: JuliCmsComponentContext<BannerData>) {}
}

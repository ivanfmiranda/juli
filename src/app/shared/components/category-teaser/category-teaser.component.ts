import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CmsComponentData } from '@spartacus/storefront';
import { Observable } from 'rxjs';
import { BannerData } from '../../../core/models/cms.model';

@Component({
  selector: 'app-category-teaser',
  templateUrl: './category-teaser.component.html',
  styleUrls: ['./category-teaser.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CategoryTeaserComponent {
  data$: Observable<BannerData> = this.componentData.data$;

  constructor(protected componentData: CmsComponentData<BannerData>) {}
}
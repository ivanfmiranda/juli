import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CmsComponentData } from '@spartacus/storefront';
import { Observable } from 'rxjs';
import { ParagraphData } from '../../../core/models/cms.model';

@Component({
  selector: 'app-paragraph',
  templateUrl: './paragraph.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParagraphComponent {
  data$: Observable<ParagraphData> = this.componentData.data$;

  constructor(protected componentData: CmsComponentData<ParagraphData>) {}
}

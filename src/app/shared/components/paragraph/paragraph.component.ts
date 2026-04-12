import { ChangeDetectionStrategy, Component, Inject, Optional } from '@angular/core';
import { Observable } from 'rxjs';
import { ParagraphData } from '../../../core/models/cms.model';
import { JULI_CMS_COMPONENT_DATA, JuliCmsComponentContext } from '../../../core/cms/tokens';

@Component({
  selector: 'app-paragraph',
  templateUrl: './paragraph.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ParagraphComponent {
  data$: Observable<ParagraphData> = this.componentData.data$;

  constructor(@Optional() @Inject(JULI_CMS_COMPONENT_DATA) protected componentData: JuliCmsComponentContext<ParagraphData>) {}
}

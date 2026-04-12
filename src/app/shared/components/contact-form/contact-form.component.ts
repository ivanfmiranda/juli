import { Component, ChangeDetectionStrategy, ChangeDetectorRef, Inject, Optional } from '@angular/core';
import { ContactFormComponentModel } from '../../../core/models/cms.model';
import { JULI_CMS_COMPONENT_DATA, JuliCmsComponentContext } from '../../../core/cms/tokens';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-contact-form',
  templateUrl: './contact-form.component.html',
  styleUrls: ['./contact-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ContactFormComponent {
  data$: Observable<ContactFormComponentModel> = this.componentData.data$;
  submitted = false;

  constructor(
    @Optional() @Inject(JULI_CMS_COMPONENT_DATA) protected componentData: JuliCmsComponentContext<ContactFormComponentModel>,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted = true;
    this.cdr.markForCheck();
  }
}

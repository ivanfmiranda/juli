import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CmsComponentData } from '@spartacus/storefront';
import { ContactFormComponentModel } from '../../../core/models/cms.model';
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
    protected componentData: CmsComponentData<ContactFormComponentModel>,
    private cdr: ChangeDetectorRef
  ) {}

  onSubmit(event: Event): void {
    event.preventDefault();
    this.submitted = true;
    this.cdr.markForCheck();
  }
}

import { ChangeDetectionStrategy, Component, Injector, Input, OnChanges, Type } from '@angular/core';
import { CmsComponentData } from '@spartacus/storefront';
import { Observable, of } from 'rxjs';
import { CmsComponentData as JuliCmsComponentData } from '../../core/models/cms.model';
import { CMS_COMPONENT_REGISTRY } from '../../spartacus/strapi-cms.module';

@Component({
  selector: 'app-cms-component-host',
  template: `
    <ng-container *ngIf="componentType" [ngComponentOutlet]="componentType" [ngComponentOutletInjector]="componentInjector"></ng-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CmsComponentHostComponent implements OnChanges {
  @Input() component!: JuliCmsComponentData;

  componentType?: Type<unknown>;
  componentInjector: Injector;

  constructor(private readonly injector: Injector) {
    this.componentInjector = injector;
  }

  ngOnChanges(): void {
    const mapping = CMS_COMPONENT_REGISTRY[this.component?.typeCode as keyof typeof CMS_COMPONENT_REGISTRY] ?? CMS_COMPONENT_REGISTRY.UnknownComponent;
    this.componentType = mapping.component as Type<unknown>;
    this.componentInjector = Injector.create({
      providers: [{
        provide: CmsComponentData,
        useValue: {
          data$: of(this.component)
        } as Pick<CmsComponentData<JuliCmsComponentData>, 'data$'>
      }],
      parent: this.injector
    });
  }
}

import { ChangeDetectionStrategy, Component, Inject, Injector, Input, OnChanges, Type } from '@angular/core';
import { of } from 'rxjs';
import { CmsComponentData as JuliCmsComponentData } from '../../core/models/cms.model';
import { JULI_CMS_COMPONENT_DATA, JULI_CMS_COMPONENT_REGISTRY } from '../../core/cms/tokens';

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

  constructor(
    private readonly injector: Injector,
    @Inject(JULI_CMS_COMPONENT_REGISTRY) private readonly registry: Record<string, { component: Type<unknown> }>
  ) {
    this.componentInjector = injector;
  }

  ngOnChanges(): void {
    const mapping = this.registry[this.component?.typeCode] ?? this.registry['UnknownComponent'];
    this.componentType = mapping.component as Type<unknown>;
    this.componentInjector = Injector.create({
      providers: [{
        provide: JULI_CMS_COMPONENT_DATA,
        useValue: { data$: of(this.component) }
      }],
      parent: this.injector
    });
  }
}

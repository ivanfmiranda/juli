import { InjectionToken, Type } from '@angular/core';
import { CmsComponentData } from '../models/cms.model';
import { Observable } from 'rxjs';

export interface JuliCmsComponentContext<T extends CmsComponentData = CmsComponentData> {
  data$: Observable<T>;
}

export const JULI_CMS_COMPONENT_DATA = new InjectionToken<JuliCmsComponentContext>('JULI_CMS_COMPONENT_DATA');
export const JULI_CMS_COMPONENT_REGISTRY = new InjectionToken<Record<string, { component: Type<unknown> }>>('JULI_CMS_COMPONENT_REGISTRY');

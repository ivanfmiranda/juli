import { Injectable } from '@angular/core';
import { PageContext, PageType } from '@spartacus/core';
import { Observable } from 'rxjs';
import { CmsPage } from '../../models/cms.model';
import { StrapiCmsAdapter } from '../adapters/strapi-cms.adapter';

@Injectable({
  providedIn: 'root'
})
export class CmsPageService {
  constructor(private readonly adapter: StrapiCmsAdapter) {}

  getPage(slug: string, preview: boolean = false): Observable<CmsPage> {
    return this.adapter.loadCanonical(new PageContext(slug, PageType.CONTENT_PAGE), preview);
  }
}
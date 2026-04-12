import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CmsPage } from '../../models/cms.model';
import { StrapiCmsAdapter } from '../adapters/strapi-cms.adapter';

@Injectable({
  providedIn: 'root'
})
export class CmsPageService {
  constructor(private readonly adapter: StrapiCmsAdapter) {}

  getPage(slug: string, preview: boolean = false): Observable<CmsPage> {
    return this.adapter.loadCanonical({ id: slug, type: 'ContentPage' }, preview);
  }
}

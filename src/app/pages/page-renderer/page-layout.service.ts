import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TenantHostService } from '../../core/services/tenant-host.service';
import { PageLayout, PageBlock } from './page-block.model';

@Injectable({ providedIn: 'root' })
export class PageLayoutService {

  private readonly cache = new Map<string, PageLayout>();

  constructor(
    private http: HttpClient,
    private tenantHost: TenantHostService,
  ) {}

  getLayout(slug: string): Observable<PageLayout | null> {
    // 1. Check in-memory cache (survives SPA navigation)
    const cached = this.cache.get(slug);
    if (cached) {
      return of(cached);
    }

    // 2. Check for SSR-embedded data (first load only)
    if (typeof window !== 'undefined' && (window as any).__PAGE_DATA__?.[slug]) {
      const data = (window as any).__PAGE_DATA__[slug] as PageLayout;
      delete (window as any).__PAGE_DATA__[slug];
      this.cache.set(slug, data);
      return of(data);
    }

    // 3. HTTP call to Strapi
    const tenantId = this.tenantHost.currentTenantId();
    let url = `${environment.strapiApiBaseUrl}/pages?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*`;
    if (tenantId && tenantId !== 'default') {
      url += `&filters[tenantKey][$eq]=${encodeURIComponent(tenantId)}`;
    }

    return this.http.get<any>(url).pipe(
      map(response => {
        const entry = response?.data?.[0];
        if (!entry) {
          console.warn('[PageLayoutService] No entry found for slug:', slug, 'raw response:', JSON.stringify(response).slice(0, 500));
          return null;
        }
        const attrs = entry.attributes || entry;
        const layout: PageLayout = {
          slug: attrs.slug || slug,
          title: attrs.title || '',
          tenantKey: attrs.tenantKey || '',
          layout: Array.isArray(attrs.layout) ? attrs.layout : [],
        };
        this.cache.set(slug, layout);
        return layout;
      }),
      catchError(err => {
        console.error('[PageLayoutService] HTTP error loading layout', slug, {
          status: err?.status,
          statusText: err?.statusText,
          message: err?.message,
          url,
        });
        return of(null);
      })
    );
  }
}

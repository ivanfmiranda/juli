import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { TenantHostService } from '../../core/services/tenant-host.service';
import { SiteChannelService } from '../../core/services/site-channel.service';
import { B2bContextService } from '../../core/user/b2b-context.service';
import { PageLayout, PageBlock } from './page-block.model';

@Injectable({ providedIn: 'root' })
export class PageLayoutService {

  private readonly cache = new Map<string, PageLayout>();

  constructor(
    private http: HttpClient,
    private tenantHost: TenantHostService,
    private siteChannel: SiteChannelService,
    private b2bContext: B2bContextService,
  ) {}

  getLayout(slug: string): Observable<PageLayout | null> {
    // Cache key includes the resolved page channel so the same slug can
    // resolve to a B2B variant for a corporate buyer and the B2C variant
    // for a guest in a HYBRID tenant without polluting each other.
    const pageChannel = this.resolvePageChannel();
    const cacheKey = `${pageChannel}::${slug}`;

    // 1. Check in-memory cache (survives SPA navigation)
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return of(cached);
    }

    // 2. Check for SSR-embedded data (first load only). SSR runs without
    // membership context so it will only have populated the B2C/ALL bucket;
    // hydrating B2B-specific content stays a client-side fetch.
    if (typeof window !== 'undefined' && (window as any).__PAGE_DATA__?.[slug] && pageChannel === 'B2C') {
      const data = (window as any).__PAGE_DATA__[slug] as PageLayout;
      delete (window as any).__PAGE_DATA__[slug];
      this.cache.set(cacheKey, data);
      return of(data);
    }

    // 3. HTTP call to Strapi. Channel filter narrows the result to pages
    // tagged for the active surface or to the channel-agnostic "ALL".
    // When two pages share the same slug (B2B vs ALL), Strapi returns
    // both ordered by id; we pick the channel-specific match first.
    const tenantId = this.tenantHost.currentTenantId();
    let url = `${environment.strapiApiBaseUrl}/api/pages?filters[slug][$eq]=${encodeURIComponent(slug)}&populate=*&locale=all`;
    if (tenantId && tenantId !== 'default') {
      url += `&filters[tenantKey][$eq]=${encodeURIComponent(tenantId)}`;
    }
    url += `&filters[channel][$in][0]=${encodeURIComponent(pageChannel)}&filters[channel][$in][1]=ALL`;

    return this.http.get<any>(url).pipe(
      map(response => {
        const entries: any[] = Array.isArray(response?.data) ? response.data : [];
        if (entries.length === 0) {
          console.warn('[PageLayoutService] No entry found for slug:', slug, 'channel:', pageChannel);
          return null;
        }
        // Prefer the channel-specific page over the ALL fallback when both exist.
        const preferred = entries.find(e => (e.attributes?.channel || e.channel) === pageChannel) || entries[0];
        const attrs = preferred.attributes || preferred;
        const layout: PageLayout = {
          slug: attrs.slug || slug,
          title: attrs.title || '',
          tenantKey: attrs.tenantKey || '',
          layout: Array.isArray(attrs.layout) ? attrs.layout : [],
        };
        this.cache.set(cacheKey, layout);
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

  /**
   * Determines which channel's pages to fetch. On a pure tenant we follow
   * the site channel; on HYBRID we follow the buyer's membership so the
   * same homepage can show consumer copy for guests and corporate copy
   * for logged-in B2B buyers.
   */
  private resolvePageChannel(): 'B2C' | 'B2B' {
    const site = this.siteChannel.current();
    if (site === 'B2B') return 'B2B';
    if (site === 'HYBRID') {
      return this.b2bContext.isB2b() ? 'B2B' : 'B2C';
    }
    return 'B2C';
  }
}

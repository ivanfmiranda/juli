/**
 * Search Page — shell
 *
 * Same shape as CategoryPage: pulls the search listing into
 * JuliProductService and renders the {@code __search-template} CMS
 * template (SearchHeader + ProductListing).
 */

import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { JuliProductService } from '../../core/commerce';
import { JuliI18nService } from '../../core/i18n/i18n.service';
import { TenantHostService } from '../../core/services/tenant-host.service';

@Component({
  selector: 'app-search-page',
  template: `<app-page-renderer slug="__search-template" [bare]="true"></app-page-renderer>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPageComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly defaultPageSize = 12;
  private readonly siteName: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly juliProductService: JuliProductService,
    private readonly i18n: JuliI18nService,
    private readonly titleService: Title,
    tenantHost: TenantHostService,
  ) {
    const tenantId = tenantHost.currentTenantId();
    this.siteName = tenantId && tenantId !== 'default'
      ? tenantId.charAt(0).toUpperCase() + tenantId.slice(1)
      : 'Juli Store';
  }

  ngOnInit(): void {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const query = (params.get('q') || '').trim();
      if (!query) {
        this.juliProductService.clearListing();
        this.titleService.setTitle(`Busca — ${this.siteName}`);
        return;
      }
      const page = Math.max(Number(params.get('page') || '0'), 0);
      const sort = params.get('sort') || undefined;
      this.juliProductService.loadSearchListing(query, page, this.defaultPageSize, sort);
      this.titleService.setTitle(`${this.i18n.translate('search.resultsFor', { query })} — ${this.siteName}`);
    });
  }

  ngOnDestroy(): void {
    this.juliProductService.clearListing();
  }
}

/**
 * Category Page (PLP) — shell
 *
 * Loads the category listing into JuliProductService and delegates
 * presentation to the {@code __category-template} CMS template, which
 * is a Strapi-driven composition of CategoryHeader + ProductListing
 * blocks. Tenants can re-order, parametrise or replace these blocks
 * via the CMS without code changes.
 */

import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { JuliProductService } from '../../core/commerce';
import { TenantHostService } from '../../core/services/tenant-host.service';

@Component({
  selector: 'app-category-page',
  template: `<app-page-renderer slug="__category-template" [bare]="true"></app-page-renderer>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryPageComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly defaultPageSize = 12;
  private readonly siteName: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly juliProductService: JuliProductService,
    private readonly titleService: Title,
    tenantHost: TenantHostService,
  ) {
    const tenantId = tenantHost.currentTenantId();
    this.siteName = tenantId && tenantId !== 'default'
      ? tenantId.charAt(0).toUpperCase() + tenantId.slice(1)
      : 'Juli Store';
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.reload());
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.reload());

    this.juliProductService.listing$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(listing => {
      if (listing?.name) this.titleService.setTitle(`${listing.name} — ${this.siteName}`);
    });
  }

  ngOnDestroy(): void {
    this.juliProductService.clearListing();
  }

  private reload(): void {
    const code = this.route.snapshot.paramMap.get('code') || '';
    if (!code) return;
    const page = Math.max(Number(this.route.snapshot.queryParamMap.get('page') || '0'), 0);
    const sort = this.route.snapshot.queryParamMap.get('sort') || undefined;
    this.juliProductService.loadCategoryListing(code, page, this.defaultPageSize, sort);
  }
}

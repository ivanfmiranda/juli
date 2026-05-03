/**
 * Product Detail Page (PDP) — shell
 *
 * Loads the product into JuliProductService and delegates rendering to
 * the {@code __product-template} CMS template (ProductDetail +
 * ProductReviews + ProductRelated blocks). Tenants compose the layout
 * via Strapi.
 */

import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { JuliProductService } from '../../core/commerce';
import { ReviewService } from '../../core/commerce/services/review.service';
import { TenantHostService } from '../../core/services/tenant-host.service';

@Component({
  selector: 'app-product-detail',
  template: `<app-page-renderer slug="__product-template" [bare]="true"></app-page-renderer>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly siteName: string;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly juliProductService: JuliProductService,
    private readonly reviewService: ReviewService,
    private readonly titleService: Title,
    tenantHost: TenantHostService,
  ) {
    const tenantId = tenantHost.currentTenantId();
    this.siteName = tenantId && tenantId !== 'default'
      ? tenantId.charAt(0).toUpperCase() + tenantId.slice(1)
      : 'Juli Store';
  }

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const code = params.get('code') || '';
      if (code) this.juliProductService.loadProductDetail(code);
    });

    this.juliProductService.detail$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(product => {
      if (product?.name) this.titleService.setTitle(`${product.name} — ${this.siteName}`);
    });
  }

  ngOnDestroy(): void {
    this.juliProductService.clearDetail();
    this.reviewService.clear();
  }
}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { JuliProductService } from '../../../core/commerce';

@Component({
  selector: 'app-product-related-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="related-products" *ngIf="(product$ | async) as product">
      <ng-container *ngIf="product.relatedProducts?.length">
        <h2>{{ titleKey | juliTranslate }}</h2>
        <div class="related-grid">
          <article class="related-card" *ngFor="let related of product.relatedProducts">
            <a [routerLink]="related.url">
              <img *ngIf="related.mainImage?.url" [src]="related.mainImage!.url" [alt]="related.name">
              <h3>{{ related.name }}</h3>
              <p class="price">{{ related.price.formattedValue }}</p>
            </a>
          </article>
        </div>
      </ng-container>
    </section>
  `,
  styleUrls: ['../../product-detail/product-detail.component.scss'],
})
export class ProductRelatedBlockComponent implements OnInit {
  @Input() props: any = {};
  private readonly destroyRef = inject(DestroyRef);

  readonly product$ = this.juliProductService.detail$;

  constructor(
    private readonly juliProductService: JuliProductService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.product$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
  }

  get titleKey(): string { return this.props?.titleKey || 'pdp.relatedProducts'; }
}

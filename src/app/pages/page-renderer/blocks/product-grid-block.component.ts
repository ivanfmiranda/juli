import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-grid-block',
  template: `
    <section class="pb-product-grid">
      <div class="pb-product-grid__header" *ngIf="props?.title">
        <h3 class="pb-product-grid__title">{{ props.title }}</h3>
        <a *ngIf="props?.categoryId" [href]="'/c/' + props.categoryId" class="pb-product-grid__viewall">
          Ver todos &rarr;
        </a>
      </div>

      <div *ngIf="loading" class="pb-product-grid__grid" [style.grid-template-columns]="gridColumns">
        <div *ngFor="let i of placeholders" class="pb-product-card pb-product-card--skeleton">
          <div class="pb-product-card__img-skeleton"></div>
          <div class="pb-product-card__body">
            <div class="skeleton-line w60"></div>
            <div class="skeleton-line w80"></div>
            <div class="skeleton-line w40"></div>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && products.length" class="pb-product-grid__grid" [style.grid-template-columns]="gridColumns">
        <a *ngFor="let p of products" class="pb-product-card" [href]="'/product/' + (p.code || p.sku || p.productCode)">
          <div class="pb-product-card__img-wrap">
            <img *ngIf="p.images?.length" [src]="p.images[0].url" [alt]="p.name" loading="lazy" />
            <div *ngIf="!p.images?.length" class="pb-product-card__img-placeholder">
              <span>{{ p.name?.charAt(0) || '?' }}</span>
            </div>
          </div>
          <div class="pb-product-card__body">
            <p class="pb-product-card__name">{{ p.name }}</p>
            <p class="pb-product-card__price" *ngIf="p.price">
              {{ formatPrice(p.price, p.currency) }}
            </p>
            <button class="pb-product-card__cta">Ver produto</button>
          </div>
        </a>
      </div>

      <div *ngIf="!loading && !products.length" class="pb-product-grid__empty">
        Nenhum produto encontrado
      </div>
    </section>
  `,
  styles: [`
    .pb-product-grid { padding: 16px 0; margin-bottom: 8px; }
    .pb-product-grid__header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 20px; }
    .pb-product-grid__title { font-size: 22px; font-weight: 700; margin: 0; color: #0f172a; }
    .pb-product-grid__viewall { font-size: 14px; color: var(--color-primary, #4f46e5); text-decoration: none; font-weight: 500; }
    .pb-product-grid__viewall:hover { text-decoration: underline; }
    .pb-product-grid__grid { display: grid; gap: 20px; }
    .pb-product-grid__empty { text-align: center; padding: 40px; color: #999; }

    .pb-product-card {
      background: #fff; border: 1px solid #e5e7eb; border-radius: 12px;
      overflow: hidden; text-decoration: none; color: inherit;
      transition: box-shadow 0.2s, transform 0.2s; display: flex; flex-direction: column;
    }
    .pb-product-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.1); transform: translateY(-2px); }
    .pb-product-card__img-wrap {
      aspect-ratio: 1; background: #f8fafc; display: flex; align-items: center; justify-content: center; overflow: hidden;
    }
    .pb-product-card__img-wrap img { width: 100%; height: 100%; object-fit: cover; }
    .pb-product-card__img-placeholder {
      width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
      font-size: 48px; font-weight: 700; color: var(--color-primary, #4f46e5); opacity: 0.6;
    }
    .pb-product-card__body { padding: 14px 16px; display: flex; flex-direction: column; gap: 6px; flex: 1; }
    .pb-product-card__name { margin: 0; font-size: 14px; font-weight: 500; color: #1f2937; line-height: 1.4;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .pb-product-card__price { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }
    .pb-product-card__cta {
      margin-top: auto; border: 1px solid #e5e7eb; background: transparent; color: var(--color-primary, #4f46e5);
      border-radius: 8px; padding: 8px; font-size: 13px; font-weight: 600; cursor: pointer;
      transition: all 0.15s;
    }
    .pb-product-card:hover .pb-product-card__cta { background: var(--color-primary, #4f46e5); color: #fff; border-color: var(--color-primary, #4f46e5); }

    .pb-product-card--skeleton { pointer-events: none; }
    .pb-product-card__img-skeleton { aspect-ratio: 1; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.5s infinite; }
    .skeleton-line { height: 14px; border-radius: 4px; background: #f0f0f0; }
    .w60 { width: 60%; }
    .w80 { width: 80%; }
    .w40 { width: 40%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    @media (max-width: 768px) {
      .pb-product-grid__grid { grid-template-columns: repeat(2, 1fr) !important; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductGridBlockComponent implements OnInit {
  @Input() props: any = {};
  products: any[] = [];
  loading = true;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const categoryId = this.props?.categoryId;
    if (!categoryId) {
      this.loading = false;
      return;
    }
    const max = parseInt(this.props?.maxItems, 10) || 4;
    this.http.get<any>(
      `${environment.ubrisApiBaseUrl}/api/storefront/category/${encodeURIComponent(categoryId)}?size=${max}`
    ).subscribe({
      next: (resp) => {
        this.products = (resp?.data?.items || []).slice(0, max);
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get gridColumns(): string {
    const cols = parseInt(this.props?.columns, 10) || 4;
    return `repeat(${cols}, 1fr)`;
  }

  get placeholders(): number[] {
    return Array.from({ length: parseInt(this.props?.maxItems, 10) || 4 });
  }

  formatPrice(price: number, currency?: string): string {
    const cur = currency || 'BRL';
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: cur }).format(price);
    } catch {
      return `R$ ${price.toFixed(2)}`;
    }
  }
}

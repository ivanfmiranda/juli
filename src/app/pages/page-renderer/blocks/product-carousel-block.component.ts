import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-product-carousel-block',
  template: `
    <section class="pc">
      <div class="pc__header" *ngIf="props?.title">
        <h3 class="pc__title">{{ props.title }}</h3>
        <div class="pc__nav">
          <a *ngIf="props?.categoryId" [href]="'/c/' + props.categoryId" class="pc__viewall">Ver todos &rarr;</a>
          <button class="pc__arrow pc__arrow--left" (click)="scrollLeft()" [disabled]="!canScrollLeft" aria-label="Anterior">&lsaquo;</button>
          <button class="pc__arrow pc__arrow--right" (click)="scrollRight()" [disabled]="!canScrollRight" aria-label="Proximo">&rsaquo;</button>
        </div>
      </div>

      <!-- Loading skeleton -->
      <div *ngIf="loading" class="pc__track" #track>
        <div *ngFor="let i of placeholders" class="pc__card pc__card--skeleton">
          <div class="pc__img-skeleton"></div>
          <div class="pc__body">
            <div class="skeleton-line w70"></div>
            <div class="skeleton-line w50"></div>
            <div class="skeleton-line w40"></div>
          </div>
        </div>
      </div>

      <!-- Products -->
      <div *ngIf="!loading && products.length" class="pc__track" #track (scroll)="onScroll()">
        <a *ngFor="let p of products" class="pc__card" [href]="'/product/' + (p.code || p.sku || p.productCode)">
          <div class="pc__img-wrap">
            <img *ngIf="p.images?.length" [src]="p.images[0].url" [alt]="p.name" loading="lazy" />
            <div *ngIf="!p.images?.length" class="pc__img-placeholder">
              <span>{{ p.name?.charAt(0) || '?' }}</span>
            </div>
          </div>
          <div class="pc__body">
            <p class="pc__name">{{ p.name }}</p>
            <p class="pc__price" *ngIf="p.price">{{ formatPrice(p.price, p.currency) }}</p>
            <span class="pc__badge" *ngIf="p.classification === 'NEW'">Novo</span>
            <span class="pc__badge pc__badge--sale" *ngIf="p.classification === 'SALE'">Oferta</span>
          </div>
        </a>
      </div>

      <div *ngIf="!loading && !products.length" class="pc__empty">Nenhum produto encontrado</div>
    </section>
  `,
  styles: [`
    .pc { padding: 8px 0; margin-bottom: 8px; }

    .pc__header {
      display: flex; align-items: center; justify-content: space-between;
      margin-bottom: 20px; gap: 16px;
    }
    .pc__title { font-size: 22px; font-weight: 700; margin: 0; color: #0f172a; }
    .pc__nav { display: flex; align-items: center; gap: 10px; }
    .pc__viewall { font-size: 14px; color: var(--color-primary, #4f46e5); text-decoration: none; font-weight: 500; margin-right: 4px; }
    .pc__viewall:hover { text-decoration: underline; }

    .pc__arrow {
      width: 36px; height: 36px; border-radius: 50%;
      border: 1.5px solid #e2e8f0; background: #fff;
      font-size: 22px; line-height: 1; color: #334155;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: all 0.15s;
    }
    .pc__arrow:hover:not(:disabled) { border-color: var(--color-primary, #4f46e5); color: var(--color-primary, #4f46e5); background: var(--color-primary-light, #eef2ff); }
    .pc__arrow:disabled { opacity: 0.3; cursor: default; }

    .pc__track {
      display: flex; gap: 18px;
      overflow-x: auto; scroll-behavior: smooth;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
      padding-bottom: 8px;
      scrollbar-width: none;
    }
    .pc__track::-webkit-scrollbar { display: none; }

    .pc__card {
      flex: 0 0 220px; scroll-snap-align: start;
      background: #fff; border: 1px solid #e5e7eb; border-radius: 14px;
      overflow: hidden; text-decoration: none; color: inherit;
      transition: box-shadow 0.2s, transform 0.2s;
      display: flex; flex-direction: column;
      position: relative;
    }
    .pc__card:hover { box-shadow: 0 8px 28px rgba(0,0,0,0.1); transform: translateY(-3px); }

    .pc__img-wrap {
      height: 200px; background: #f8fafc;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .pc__img-wrap img { width: 100%; height: 100%; object-fit: contain; padding: 8px; }
    .pc__img-placeholder {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
      font-size: 42px; font-weight: 700; color: var(--color-primary, #4f46e5); opacity: 0.5;
    }

    .pc__body { padding: 14px 16px; display: flex; flex-direction: column; gap: 4px; flex: 1; }
    .pc__name {
      margin: 0; font-size: 14px; font-weight: 500; color: #1f2937; line-height: 1.35;
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .pc__price { margin: 0; font-size: 18px; font-weight: 700; color: #0f172a; }

    .pc__badge {
      position: absolute; top: 10px; left: 10px;
      font-size: 11px; font-weight: 700; text-transform: uppercase;
      letter-spacing: 0.04em;
      padding: 3px 10px; border-radius: 4px;
      background: var(--color-primary, #4f46e5); color: #fff;
    }
    .pc__badge--sale { background: #dc2626; }

    .pc__empty { text-align: center; padding: 40px; color: #94a3b8; }

    /* Skeleton */
    .pc__card--skeleton { pointer-events: none; }
    .pc__img-skeleton {
      height: 200px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
      background-size: 200% 100%; animation: shimmer 1.5s infinite;
    }
    .skeleton-line { height: 13px; border-radius: 4px; background: #f0f0f0; }
    .w70 { width: 70%; }
    .w50 { width: 50%; }
    .w40 { width: 40%; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    @media (max-width: 640px) {
      .pc__card { flex: 0 0 170px; }
      .pc__img-wrap { height: 160px; }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCarouselBlockComponent implements OnInit {
  @Input() props: any = {};
  @ViewChild('track') trackRef!: ElementRef<HTMLElement>;

  products: any[] = [];
  loading = true;
  canScrollLeft = false;
  canScrollRight = true;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    const categoryId = this.props?.categoryId;
    if (!categoryId) { this.loading = false; return; }
    const max = parseInt(this.props?.maxItems, 10) || 8;
    this.http.get<any>(
      `${environment.ubrisApiBaseUrl}/api/storefront/category/${encodeURIComponent(categoryId)}?size=${max}`
    ).subscribe({
      next: (resp) => {
        this.products = (resp?.data?.items || []).slice(0, max);
        this.loading = false;
        this.cdr.markForCheck();
        setTimeout(() => this.updateScrollState(), 100);
      },
      error: () => { this.loading = false; this.cdr.markForCheck(); }
    });
  }

  get placeholders(): number[] {
    return Array.from({ length: parseInt(this.props?.maxItems, 10) || 6 });
  }

  scrollLeft(): void {
    const el = this.trackRef?.nativeElement;
    if (el) { el.scrollBy({ left: -480, behavior: 'smooth' }); }
  }

  scrollRight(): void {
    const el = this.trackRef?.nativeElement;
    if (el) { el.scrollBy({ left: 480, behavior: 'smooth' }); }
  }

  onScroll(): void {
    this.updateScrollState();
    this.cdr.markForCheck();
  }

  private updateScrollState(): void {
    const el = this.trackRef?.nativeElement;
    if (!el) return;
    this.canScrollLeft = el.scrollLeft > 10;
    this.canScrollRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 10;
  }

  formatPrice(price: number, currency?: string): string {
    try {
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(price);
    } catch { return `R$ ${price.toFixed(2)}`; }
  }
}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NavCategory, TenantBrandingApiService } from '../../../core/services/tenant-branding-api.service';
import { IconName } from '../../../shared/components/icon/icon.component';

interface ResolvedCategory extends NavCategory {
  routerLink: any[];
  queryParams: Record<string, string> | null;
  iconName: IconName;
}

@Component({
  selector: 'app-category-teasers-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ct" *ngIf="(categories$ | async) as cats">
      <header *ngIf="props?.title || props?.subtitle" class="ct__header">
        <h2 *ngIf="props?.title" class="ct__title">{{ props.title }}</h2>
        <p *ngIf="props?.subtitle" class="ct__subtitle">{{ props.subtitle }}</p>
      </header>

      <div class="ct__grid" [class.ct__grid--2]="(props?.columns || 4) === 2"
                            [class.ct__grid--3]="(props?.columns || 4) === 3"
                            [class.ct__grid--4]="(props?.columns || 4) === 4"
                            [class.ct__grid--6]="(props?.columns || 4) === 6">
        <a *ngFor="let cat of cats; trackBy: trackByCode"
           class="ct__card"
           [routerLink]="cat.routerLink"
           [queryParams]="cat.queryParams">
          <div class="ct__icon">
            <app-icon [name]="cat.iconName" [size]="32"></app-icon>
          </div>
          <div class="ct__label">{{ cat.label || ((cat.translationKey || '') | juliTranslate) || cat.code }}</div>
          <div class="ct__cta">{{ ('categoryTeasers.see' | juliTranslate) || 'Ver categoria' }} →</div>
        </a>
      </div>

      <div *ngIf="!cats.length" class="ct__empty">{{ 'categoryTeasers.empty' | juliTranslate }}</div>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .ct { padding: 16px 0 24px; }
    .ct__header { text-align: center; margin: 0 0 24px; padding: 0 16px; }
    .ct__title { font-size: 28px; font-weight: 700; margin: 0 0 8px; color: #0f172a; line-height: 1.2; }
    .ct__subtitle { font-size: 15px; color: #64748b; margin: 0; line-height: 1.5; }
    .ct__grid { display: grid; gap: 16px; }
    .ct__grid--2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ct__grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .ct__grid--4 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .ct__grid--6 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    @media (min-width: 720px) {
      .ct__grid--4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
      .ct__grid--6 { grid-template-columns: repeat(6, minmax(0, 1fr)); }
    }
    .ct__card {
      position: relative;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 10px;
      padding: 28px 16px 24px;
      background: #fff;
      border: 1px solid rgba(15, 23, 42, 0.06);
      border-radius: 14px;
      text-decoration: none; color: inherit;
      box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
    }
    .ct__card:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
      border-color: var(--color-primary, #4f46e5);
    }
    .ct__icon {
      display: flex; align-items: center; justify-content: center;
      width: 56px; height: 56px;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--color-primary, #4f46e5) 0%, var(--color-primary-hover, #4338ca) 100%);
      color: #fff;
    }
    .ct__label { font-weight: 600; font-size: 14px; text-align: center; color: #0f172a; }
    .ct__cta { font-size: 12px; color: #64748b; transition: color 0.15s; }
    .ct__card:hover .ct__cta { color: var(--color-primary, #4f46e5); }
    .ct__empty { text-align: center; color: #94a3b8; padding: 24px; }
  `],
})
export class CategoryTeasersBlockComponent implements OnInit {
  @Input() props: any = {};
  private readonly destroyRef = inject(DestroyRef);

  readonly categories$: Observable<ResolvedCategory[]> = this.brandingApi.config$.pipe(
    map(config => {
      const limit = typeof this.props?.limit === 'number' && this.props.limit > 0 ? this.props.limit : Infinity;
      const exclude: string[] = Array.isArray(this.props?.exclude) ? this.props.exclude : [];
      return (config.navCategories || [])
        .filter(c => !exclude.includes(c.code))
        .slice(0, limit)
        .map(c => this.resolve(c));
    }),
  );

  constructor(
    private readonly brandingApi: TenantBrandingApiService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.categories$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
  }

  trackByCode = (_idx: number, cat: ResolvedCategory) => cat.code;

  /**
   * Mirrors site-header.categoryRouterLink/queryParams/resolveNavIcon so the
   * teasers honour the same {@code url} override semantics (custom search
   * queries, landing pages) instead of always falling back to /c/{code}.
   */
  private resolve(cat: NavCategory): ResolvedCategory {
    const routerLink = cat.url
      ? [cat.url.split('?')[0] || `/c/${cat.code}`]
      : ['/c', cat.code];
    let queryParams: Record<string, string> | null = null;
    if (cat.url && cat.url.includes('?')) {
      queryParams = {};
      const query = cat.url.substring(cat.url.indexOf('?') + 1);
      for (const part of query.split('&')) {
        const [k, v] = part.split('=');
        if (k) queryParams[decodeURIComponent(k)] = decodeURIComponent(v || '');
      }
    }
    return { ...cat, routerLink, queryParams, iconName: this.resolveIcon(cat.icon) };
  }

  private resolveIcon(raw: string | undefined): IconName {
    if (!raw) return 'badge-check';
    const trimmed = raw.trim().toLowerCase();
    const valid: IconName[] = [
      'shopping-cart', 'x', 'heart', 'star', 'package', 'truck',
      'shield-check', 'credit-card', 'wrench', 'headset', 'search',
      'check', 'zap', 'lock', 'badge-check', 'arrow-right',
    ];
    if ((valid as string[]).includes(trimmed)) return trimmed as IconName;
    const emoji: Record<string, IconName> = {
      '🛒': 'shopping-cart', '❤️': 'heart', '⭐': 'star',
      '📦': 'package', '🚚': 'truck', '🛡️': 'shield-check',
      '💳': 'credit-card', '🔧': 'wrench', '🛠️': 'wrench',
      '🎧': 'headset', '🔍': 'search', '✅': 'check',
      '⚡': 'zap', '🏷️': 'zap', '🔒': 'lock', '🔐': 'lock',
      '🚀': 'zap', '✔️': 'badge-check',
    };
    return emoji[trimmed] ?? 'badge-check';
  }
}

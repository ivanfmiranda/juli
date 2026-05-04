import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NavCategory, TenantBrandingApiService } from '../../../core/services/tenant-branding-api.service';

/**
 * CMS-embeddable nav-categories strip. Reuses {@code NavCategoriesComponent}
 * (the same one the site-header renders) so a CMS-driven sub-nav is
 * visually consistent with the global header. Authors drop this block in
 * a layout to expose categories inline (e.g. on a landing page that
 * doesn't show the global header, or to highlight a curated subset).
 */
@Component({
  selector: 'app-nav-categories-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="ncb">
      <header *ngIf="props?.title" class="ncb__header">
        <h3 class="ncb__title">{{ props.title }}</h3>
      </header>
      <app-nav-categories
        [categories]="(categories$ | async) || []"
        [showSale]="!!props?.showSale"
        [centered]="props?.alignment !== 'left'">
      </app-nav-categories>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .ncb { padding: 12px 0; }
    .ncb__header { margin-bottom: 12px; }
    .ncb__title { font-size: 18px; font-weight: 600; margin: 0; color: #0f172a; }
  `],
})
export class NavCategoriesBlockComponent implements OnInit {
  @Input() props: any = {};
  private readonly destroyRef = inject(DestroyRef);

  readonly categories$: Observable<NavCategory[]> = this.brandingApi.config$.pipe(
    map(config => {
      const limit = typeof this.props?.limit === 'number' && this.props.limit > 0 ? this.props.limit : Infinity;
      const exclude: string[] = Array.isArray(this.props?.exclude) ? this.props.exclude : [];
      const include: string[] = Array.isArray(this.props?.include) ? this.props.include : [];
      const all = config.navCategories || [];
      const filtered = include.length > 0
        ? include.map(code => all.find(c => c.code === code)).filter((c): c is NavCategory => !!c)
        : all.filter(c => !exclude.includes(c.code));
      return filtered.slice(0, limit);
    }),
  );

  constructor(
    private readonly brandingApi: TenantBrandingApiService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.categories$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.cdr.markForCheck());
  }
}

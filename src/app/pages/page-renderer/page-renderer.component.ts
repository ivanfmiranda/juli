import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { distinctUntilChanged, filter, switchMap, map, startWith, takeUntil } from 'rxjs/operators';
import { PageLayoutService } from './page-layout.service';
import { PageLayout } from './page-block.model';
import { TenantHostService } from '../../core/services/tenant-host.service';

@Component({
  selector: 'app-page-renderer',
  template: `
    <ng-container *ngIf="layout; else loading">
      <div *ngIf="layout.layout?.length" class="pb-page">
        <ng-container *ngFor="let block of layout.layout; trackBy: trackByBlock">
          <app-banner-block *ngIf="block.type === 'Banner'" [props]="block.props"></app-banner-block>
          <app-text-block *ngIf="block.type === 'TextBlock'" [props]="block.props"></app-text-block>
          <app-product-grid-block *ngIf="block.type === 'ProductGrid'" [props]="block.props"></app-product-grid-block>
          <app-carousel-block *ngIf="block.type === 'CarouselBlock'" [props]="block.props"></app-carousel-block>
          <app-html-block *ngIf="block.type === 'HtmlBlock'" [props]="block.props"></app-html-block>
          <app-spacer-block *ngIf="block.type === 'SpacerBlock'" [props]="block.props"></app-spacer-block>
          <app-video-block *ngIf="block.type === 'VideoBlock'" [props]="block.props"></app-video-block>
          <app-form-block *ngIf="block.type === 'FormBlock'" [props]="block.props"></app-form-block>
          <app-map-block *ngIf="block.type === 'MapBlock'" [props]="block.props"></app-map-block>
          <app-product-carousel-block *ngIf="block.type === 'ProductCarousel'" [props]="block.props"></app-product-carousel-block>
        </ng-container>
      </div>
      <div *ngIf="!layout.layout?.length" class="pb-not-found">
        <h2>Pagina nao encontrada</h2>
        <p>A pagina solicitada nao existe ou nao esta publicada.</p>
      </div>
    </ng-container>
    <ng-template #loading>
      <div class="pb-loading">Carregando pagina...</div>
    </ng-template>
  `,
  styles: [`
    .pb-page { max-width: 1200px; margin: 0 auto; padding: 24px 16px; }
    .pb-not-found { text-align: center; padding: 80px 16px; }
    .pb-not-found h2 { font-size: 24px; color: #333; margin-bottom: 8px; }
    .pb-not-found p { color: #666; }
    .pb-loading { text-align: center; padding: 80px 16px; color: #999; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageRendererComponent implements OnInit, OnDestroy {

  layout: PageLayout | null = null;
  private siteName: string;
  private readonly destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private pageLayoutService: PageLayoutService,
    private titleService: Title,
    private tenantHost: TenantHostService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
  ) {
    const tenantId = this.tenantHost.currentTenantId();
    this.siteName = tenantId && tenantId !== 'default'
      ? tenantId.charAt(0).toUpperCase() + tenantId.slice(1)
      : 'Juli Store';
  }

  ngOnInit(): void {
    // Use Router.events to reliably detect navigation to this component,
    // combined with ActivatedRoute snapshot to extract slug.
    // This avoids issues where paramMap may not re-emit for the '' route.
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      startWith(null as any), // trigger on initial load
      map(() => this.route.snapshot.paramMap.get('slug') || 'home'),
      distinctUntilChanged(),
      switchMap(slug => this.pageLayoutService.getLayout(slug).pipe(
        map(layout => layout || { slug, title: '', tenantKey: '', layout: [] } as PageLayout)
      )),
      takeUntil(this.destroy$)
    ).subscribe(layout => {
      this.ngZone.run(() => {
        this.layout = layout;
        if (layout?.title) {
          this.titleService.setTitle(`${layout.title} — ${this.siteName}`);
        } else {
          this.titleService.setTitle(this.siteName);
        }
        if (typeof document !== 'undefined') {
          const ssr = document.getElementById('ssr-page-content');
          if (ssr) { ssr.remove(); }
        }
        this.cdr.markForCheck();
      });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByBlock = (_index: number, block: { id: string }) => block.id;
}

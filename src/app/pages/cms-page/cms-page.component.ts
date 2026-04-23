import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CmsPage, CmsComponentData } from '../../core/models/cms.model';
import { CmsPageService } from '../../core/cms/services/cms-page.service';
import { SmartEditBridgeService } from '../../core/cms/services/smartedit-bridge.service';
import { environment } from '../../../environments/environment';
import { JuliI18nService } from '../../core/i18n/i18n.service';

/** Map Strapi slot names to canonical region names */
const SLOT_TO_REGION: Record<string, string> = {
  header_slots: 'header',
  content_slots: 'main',
  sidebar_slots: 'sidebar',
  below_fold_slots: 'belowFold',
  footer_slots: 'footer',
};

@Component({
  selector: 'app-cms-page',
  templateUrl: './cms-page.component.html',
  styleUrls: ['./cms-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CmsPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  readonly isPreview: boolean = this.route.snapshot.data['preview'] === true;
  readonly regionOrder: Array<'header' | 'main' | 'sidebar' | 'belowFold' | 'footer'> = ['header', 'main', 'sidebar', 'belowFold', 'footer'];
  readonly page$: Observable<CmsPage> = combineLatest([
    this.route.paramMap.pipe(map(params => params.get('slug') || environment.defaultCmsSlug)),
    this.i18n.locale$
  ]).pipe(
    switchMap(([slug]) => this.cmsPageService.getPage(slug, this.isPreview))
  );

  private currentPage: CmsPage | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly cmsPageService: CmsPageService,
    private readonly i18n: JuliI18nService,
    private readonly cdr: ChangeDetectorRef,
    readonly smartEdit: SmartEditBridgeService,
  ) {}

  ngOnInit(): void {
    // Track current page for SmartEdit updates
    this.page$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(page => {
      this.currentPage = page;
    });

    // Listen for SmartEdit component updates
    this.smartEdit.update$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(update => {
      if (!this.currentPage) return;
      const regionName = SLOT_TO_REGION[update.slotName] || update.slotName;
      const region = this.currentPage.regions[regionName];
      if (!region?.components?.[update.componentIndex]) return;

      // Merge updated properties into the component
      const comp = region.components[update.componentIndex];
      Object.assign(comp, update.component);
      this.cdr.markForCheck();
    });
  }

  /** Returns the Strapi slot name for a canonical region name (for SmartEdit) */
  getSlotName(regionName: string): string {
    for (const [slot, region] of Object.entries(SLOT_TO_REGION)) {
      if (region === regionName) return slot;
    }
    return regionName;
  }

  trackByRegion = (_index: number, regionName: string) => regionName;
  trackByComponent = (_index: number, component: { uid: string }) => component.uid;
}

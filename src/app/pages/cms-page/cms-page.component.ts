import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CmsPage } from '../../core/models/cms.model';
import { CmsPageService } from '../../core/cms/services/cms-page.service';
import { environment } from '../../../environments/environment';
import { JuliI18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-cms-page',
  templateUrl: './cms-page.component.html',
  styleUrls: ['./cms-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CmsPageComponent {
  readonly isPreview: boolean = this.route.snapshot.data['preview'] === true;
  readonly regionOrder: Array<'header' | 'main' | 'sidebar' | 'belowFold' | 'footer'> = ['header', 'main', 'sidebar', 'belowFold', 'footer'];
  readonly page$: Observable<CmsPage> = combineLatest([
    this.route.paramMap.pipe(map(params => params.get('slug') || environment.defaultCmsSlug)),
    this.i18n.locale$
  ]).pipe(
    switchMap(([slug]) => this.cmsPageService.getPage(slug, this.isPreview))
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly cmsPageService: CmsPageService,
    private readonly i18n: JuliI18nService
  ) {}

  trackByRegion = (_index: number, regionName: string) => regionName;
  trackByComponent = (_index: number, component: { uid: string }) => component.uid;
}

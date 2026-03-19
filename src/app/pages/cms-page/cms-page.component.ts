import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { CmsPage } from '../../core/models/cms.model';
import { CmsPageService } from '../../core/cms/services/cms-page.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-cms-page',
  templateUrl: './cms-page.component.html',
  styleUrls: ['./cms-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CmsPageComponent {
  readonly regionOrder: Array<'header' | 'main' | 'sidebar' | 'belowFold' | 'footer'> = ['header', 'main', 'sidebar', 'belowFold', 'footer'];
  readonly page$: Observable<CmsPage> = this.route.paramMap.pipe(
    map(params => params.get('slug') || environment.defaultCmsSlug),
    switchMap(slug => this.cmsPageService.getPage(slug, this.route.snapshot.data['preview'] === true))
  );

  constructor(private readonly route: ActivatedRoute, private readonly cmsPageService: CmsPageService) {}

  trackByRegion = (_index: number, regionName: string) => regionName;
  trackByComponent = (_index: number, component: { uid: string }) => component.uid;
}
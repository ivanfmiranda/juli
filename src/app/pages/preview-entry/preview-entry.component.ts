import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PreviewTokenService } from '../../core/cms/services/preview-token.service';

@Component({
  selector: 'app-preview-entry',
  template: '',
})
export class PreviewEntryComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly previewToken: PreviewTokenService,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const slug = params.get('slug') || 'home';
    const token = params.get('token');
    const tenant = params.get('tenant');
    const catalogVersion = params.get('catalogVersion');

    if (token) {
      this.previewToken.setToken(token);
    }
    if (tenant) {
      this.previewToken.setTenantOverride(tenant);
    }
    if (catalogVersion) {
      this.previewToken.setCatalogVersion(catalogVersion);
    } else {
      this.previewToken.setCatalogVersion('ONLINE');
    }

    this.router.navigate(['/page/preview', slug], { replaceUrl: true });
  }
}

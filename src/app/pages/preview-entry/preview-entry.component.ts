import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PreviewTokenService } from '../../core/cms/services/preview-token.service';
import { SmartEditBridgeService } from '../../core/cms/services/smartedit-bridge.service';

@Component({
  selector: 'app-preview-entry',
  template: '',
})
export class PreviewEntryComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly previewToken: PreviewTokenService,
    private readonly smartEditBridge: SmartEditBridgeService,
  ) {}

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const slug = params.get('slug') || 'home';
    const token = params.get('token');
    const tenant = params.get('tenant');
    const catalogVersion = params.get('catalogVersion');
    const smartedit = params.get('smartedit');

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

    // Activate SmartEdit mode when requested by CMS editor
    if (smartedit === 'true') {
      this.smartEditBridge.activate();
    }

    // Route to the page-builder renderer (same route as normal pages)
    // This ensures preview renders identically to the live storefront
    this.router.navigate(['/', slug], { replaceUrl: true });
  }
}

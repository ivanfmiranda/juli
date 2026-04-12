import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { TenantBranding } from '../models/saas.models';
import { TenantBrandingConfig } from './tenant-branding-api.service';

@Injectable({ providedIn: 'root' })
export class JuliBrandingService {
  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /** Apply theme from TenantBrandingConfig (fetched from Strapi). */
  applyTenantTheme(config: TenantBrandingConfig): void {
    if (!config || !config.theme || Object.keys(config.theme).length === 0) return;
    const root = document.documentElement;
    Object.entries(config.theme).forEach(([prop, value]) => {
      root.style.setProperty(prop, value);
    });
  }

  /** Apply branding from API (TenantBranding model - kept for backwards compatibility). */
  applyBranding(branding: TenantBranding): void {
    if (!branding) return;
    const root = document.body;
    if (branding.primaryColor) {
      this.renderer.setStyle(root, '--juli-primary-color', branding.primaryColor);
    }
    if (branding.secondaryColor) {
      this.renderer.setStyle(root, '--juli-secondary-color', branding.secondaryColor);
    }
    if (branding.customCssVariables) {
      Object.entries(branding.customCssVariables).forEach(([key, value]) => {
        this.renderer.setStyle(root, `--juli-custom-${key}`, value);
      });
    }
    if (branding.faviconUrl) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = branding.faviconUrl;
      }
    }
  }
}

import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { TenantBranding } from '../models/saas.models';

@Injectable({ providedIn: 'root' })
export class JuliBrandingService {
  private renderer: Renderer2;

  constructor(rendererFactory: RendererFactory2) {
    this.renderer = rendererFactory.createRenderer(null, null);
  }

  /**
   * Aplica o branding do tenant via variáveis CSS dinâmicas.
   */
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

    // Atualiza o favicon se necessário
    if (branding.faviconUrl) {
      const link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (link) {
        link.href = branding.faviconUrl;
      }
    }
  }
}

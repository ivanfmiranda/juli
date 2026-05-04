import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NavCategory } from '../../../core/services/tenant-branding-api.service';
import { IconComponent, IconName } from '../icon/icon.component';
import { JuliI18nModule } from '../../../core/i18n/i18n.module';

/**
 * Renders the tenant nav-categories list as either inline pills (default,
 * matching the legacy site-header markup) or as a stand-alone strip the
 * CMS can drop into a page layout via {@code NavCategoriesBlock}.
 *
 * Single owner of routerLink/queryParams/icon resolution so the nav stays
 * consistent across header and CMS without copying the lookups.
 */
@Component({
  selector: 'app-nav-categories',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent, JuliI18nModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul class="nc-list" [class.nc-list--centered]="centered">
      <li *ngFor="let cat of categories; trackBy: trackByCode">
        <a [routerLink]="routerLinkFor(cat)"
           [queryParams]="queryParamsFor(cat)"
           class="nc-link">
          <span class="nc-icon">
            <app-icon [name]="iconNameFor(cat.icon)" [size]="iconSize"></app-icon>
          </span>
          <span>{{ cat.label || ((cat.translationKey || '') | juliTranslate) || cat.code }}</span>
        </a>
      </li>
      <li *ngIf="showSale" class="nc-highlight">
        <a routerLink="/c/promocoes" class="nc-link nc-link--sale">
          <span class="nc-icon">
            <app-icon name="zap" [size]="iconSize"></app-icon>
          </span>
          <span>{{ 'header.sale' | juliTranslate }}</span>
        </a>
      </li>
    </ul>
  `,
  styles: [`
    .nc-list {
      list-style: none; margin: 0; padding: 0;
      display: flex; flex-wrap: wrap; gap: 8px 16px;
      align-items: center;
    }
    .nc-list--centered { justify-content: center; }
    .nc-link {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 12px;
      color: inherit; text-decoration: none;
      font-size: 14px; font-weight: 500;
      border-radius: 8px;
      transition: background 0.15s, color 0.15s;
    }
    .nc-link:hover { background: rgba(15, 23, 42, 0.05); color: var(--color-primary, #4f46e5); }
    .nc-link--sale { color: #dc2626; }
    .nc-link--sale:hover { background: rgba(220, 38, 38, 0.08); color: #b91c1c; }
    .nc-icon { display: inline-flex; }
  `],
})
export class NavCategoriesComponent {
  @Input() categories: NavCategory[] = [];
  /** Show the legacy "/c/promocoes" highlight pill (default tenant). */
  @Input() showSale = false;
  @Input() centered = false;
  @Input() iconSize = 16;

  trackByCode = (_idx: number, c: NavCategory) => c.code;

  routerLinkFor(cat: NavCategory): any[] {
    if (cat.url) return [cat.url.split('?')[0] || `/c/${cat.code}`];
    return ['/c', cat.code];
  }

  queryParamsFor(cat: NavCategory): Record<string, string> | null {
    if (!cat.url || !cat.url.includes('?')) return null;
    const params: Record<string, string> = {};
    const query = cat.url.substring(cat.url.indexOf('?') + 1);
    for (const part of query.split('&')) {
      const [k, v] = part.split('=');
      if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
    }
    return params;
  }

  iconNameFor(raw: string | undefined): IconName {
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

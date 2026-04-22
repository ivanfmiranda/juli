import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Minimal inline-SVG icon renderer. Avoids the emoji inconsistency across
 * OS/browsers (same glyph renders different across Windows / Mac / iOS /
 * Android) and the "notion template" look. Paths are verbatim Lucide
 * outline icons (https://lucide.dev, ISC license) — embedded inline so
 * the storefront bundle does not pull a 600 KB icon pack for six icons.
 *
 * Usage:
 *   <app-icon name="shopping-cart"></app-icon>
 *   <app-icon name="heart" [filled]="true" [size]="20"></app-icon>
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      xmlns="http://www.w3.org/2000/svg"
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      [attr.fill]="filled ? 'currentColor' : 'none'"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-hidden]="ariaLabel ? null : 'true'"
      [attr.aria-label]="ariaLabel"
      [attr.role]="ariaLabel ? 'img' : null"
      [innerHTML]="pathHtml"
    ></svg>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
    }
  `],
})
export class IconComponent {
  @Input() name: IconName = 'package';
  @Input() size: number | string = 18;
  @Input() filled = false;
  @Input() ariaLabel: string | null = null;

  get pathHtml(): string {
    return ICON_PATHS[this.name] ?? ICON_PATHS.package;
  }
}

export type IconName =
  | 'shopping-cart'
  | 'x'
  | 'heart'
  | 'star'
  | 'package'
  | 'truck'
  | 'shield-check'
  | 'credit-card'
  | 'wrench'
  | 'headset'
  | 'search'
  | 'check'
  | 'zap'
  | 'lock'
  | 'badge-check'
  | 'arrow-right';

// Verbatim outline paths from Lucide (https://lucide.dev) — ISC license.
// innerHTML accepts only elements, so each entry is the inner markup of the
// <svg> tag (paths/circles/lines).
const ICON_PATHS: Record<IconName, string> = {
  'shopping-cart':
    '<circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/>' +
    '<path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>',
  'x':
    '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'heart':
    '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z"/>',
  'star':
    '<path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z"/>',
  'package':
    '<path d="m7.5 4.27 9 5.15"/>' +
    '<path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>' +
    '<path d="M3.3 7 12 12l8.7-5"/><path d="M12 22V12"/>',
  'truck':
    '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/>' +
    '<path d="M15 18H9"/>' +
    '<path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/>' +
    '<circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  'shield-check':
    '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>' +
    '<path d="m9 12 2 2 4-4"/>',
  'credit-card':
    '<rect width="20" height="14" x="2" y="5" rx="2"/>' +
    '<line x1="2" x2="22" y1="10" y2="10"/>',
  'wrench':
    '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
  'headset':
    '<path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1z"/>' +
    '<path d="M21 11h-3a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h2a1 1 0 0 0 1-1z"/>' +
    '<path d="M3 11a9 9 0 1 1 18 0"/>' +
    '<path d="M21 16v2a4 4 0 0 1-4 4h-5"/>',
  'search':
    '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  'check':
    '<path d="M20 6 9 17l-5-5"/>',
  'zap':
    '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
  'lock':
    '<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>' +
    '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'badge-check':
    '<path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/>' +
    '<path d="m9 12 2 2 4-4"/>',
  'arrow-right':
    '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
};

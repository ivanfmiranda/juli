import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-banner-block',
  template: `
    <!-- HERO mode: full-width background image with overlay -->
    <section *ngIf="props?.variant === 'hero'" class="pb-hero" [style.min-height.px]="props?.height || 420">
      <div class="pb-hero__bg" [style.background-image]="'url(' + props?.imageUrl + ')'" *ngIf="props?.imageUrl"></div>
      <div class="pb-hero__overlay" [style.background]="overlayGradient"></div>
      <div class="pb-hero__content" [class.pb-hero__content--center]="props?.align === 'center'" [class.pb-hero__content--right]="props?.align === 'right'">
        <span *ngIf="props?.eyebrow" class="pb-hero__eyebrow">{{ props.eyebrow }}</span>
        <h1 *ngIf="props?.title" class="pb-hero__title">{{ props.title }}</h1>
        <p *ngIf="props?.subtitle" class="pb-hero__subtitle">{{ props.subtitle }}</p>
        <div class="pb-hero__actions" *ngIf="props?.ctaLabel">
          <a [href]="props?.ctaUrl || '#'" class="pb-hero__cta">{{ props.ctaLabel }}</a>
          <a *ngIf="props?.ctaLabel2" [href]="props?.ctaUrl2 || '#'" class="pb-hero__cta pb-hero__cta--outline">{{ props.ctaLabel2 }}</a>
        </div>
      </div>
    </section>

    <!-- DEFAULT mode: compact side-by-side banner -->
    <section *ngIf="props?.variant !== 'hero'" class="pb-banner" [style.background-color]="props?.bgColor || '#f5f5f5'">
      <div class="pb-banner__content">
        <h2 *ngIf="props?.title" class="pb-banner__title">{{ props.title }}</h2>
        <p *ngIf="props?.subtitle" class="pb-banner__subtitle">{{ props.subtitle }}</p>
        <a *ngIf="props?.ctaLabel && props?.ctaUrl" [href]="props.ctaUrl" class="pb-banner__cta">
          {{ props.ctaLabel }}
        </a>
      </div>
      <img *ngIf="props?.imageUrl" [src]="props.imageUrl" [alt]="props?.title || 'Banner'" class="pb-banner__image" loading="lazy" />
    </section>
  `,
  styles: [`
    /* ── HERO ── */
    .pb-hero {
      position: relative;
      display: flex;
      align-items: center;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 16px;
    }
    .pb-hero__bg {
      position: absolute; inset: 0;
      background-size: cover; background-position: center;
      transition: transform 8s ease;
    }
    .pb-hero:hover .pb-hero__bg { transform: scale(1.04); }
    .pb-hero__overlay { position: absolute; inset: 0; }
    .pb-hero__content {
      position: relative; z-index: 1;
      padding: 56px 48px;
      max-width: 640px;
    }
    .pb-hero__content--center { margin: 0 auto; text-align: center; max-width: 720px; }
    .pb-hero__content--right { margin-left: auto; text-align: right; }
    .pb-hero__eyebrow {
      display: inline-block;
      font-size: 12px; font-weight: 700;
      letter-spacing: 0.12em; text-transform: uppercase;
      color: rgba(255,255,255,0.85);
      background: rgba(255,255,255,0.15);
      padding: 5px 14px; border-radius: 20px;
      margin-bottom: 16px;
    }
    .pb-hero__title {
      font-size: 40px; font-weight: 800;
      color: #fff; line-height: 1.15;
      margin: 0 0 14px;
      text-shadow: 0 2px 12px rgba(0,0,0,0.2);
    }
    .pb-hero__subtitle {
      font-size: 17px; color: rgba(255,255,255,0.9);
      line-height: 1.6; margin: 0 0 28px;
      text-shadow: 0 1px 4px rgba(0,0,0,0.15);
    }
    .pb-hero__actions { display: flex; gap: 12px; flex-wrap: wrap; }
    .pb-hero__content--center .pb-hero__actions { justify-content: center; }
    .pb-hero__cta {
      display: inline-block;
      padding: 14px 32px;
      background: #fff; color: #0f172a;
      text-decoration: none; border-radius: 10px;
      font-weight: 700; font-size: 15px;
      transition: all 0.2s;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .pb-hero__cta:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.15); }
    .pb-hero__cta--outline {
      background: transparent; color: #fff;
      border: 2px solid rgba(255,255,255,0.5);
      box-shadow: none;
    }
    .pb-hero__cta--outline:hover { background: rgba(255,255,255,0.1); border-color: #fff; box-shadow: none; }

    /* ── COMPACT BANNER ── */
    .pb-banner {
      display: flex; align-items: center; justify-content: space-between;
      padding: 40px 32px; min-height: 200px;
      border-radius: 16px; overflow: hidden;
      margin-bottom: 16px; flex-wrap: wrap; gap: 24px;
    }
    .pb-banner__content { flex: 1; min-width: 280px; }
    .pb-banner__title { font-size: 26px; font-weight: 700; margin: 0 0 8px; color: #0f172a; }
    .pb-banner__subtitle { font-size: 15px; color: #475569; margin: 0 0 18px; line-height: 1.5; }
    .pb-banner__cta {
      display: inline-block; padding: 11px 26px;
      background: #4f46e5; color: #fff;
      text-decoration: none; border-radius: 8px;
      font-weight: 600; font-size: 14px;
      transition: all 0.15s;
    }
    .pb-banner__cta:hover { background: #4338ca; transform: translateY(-1px); }
    .pb-banner__image { max-width: 38%; max-height: 250px; object-fit: cover; border-radius: 12px; }

    @media (max-width: 768px) {
      .pb-hero__content { padding: 36px 24px; }
      .pb-hero__title { font-size: 28px; }
      .pb-hero__subtitle { font-size: 15px; }
      .pb-banner { flex-direction: column; text-align: center; }
      .pb-banner__image { max-width: 100%; }
    }
  `]
})
export class BannerBlockComponent {
  @Input() props: any = {};

  get overlayGradient(): string {
    if (this.props?.overlayColor) return this.props.overlayColor;
    return 'linear-gradient(135deg, rgba(15,23,42,0.75) 0%, rgba(30,41,59,0.45) 50%, rgba(0,0,0,0.2) 100%)';
  }
}

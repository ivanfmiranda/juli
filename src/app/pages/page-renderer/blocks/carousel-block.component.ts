import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-carousel-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pb-carousel">
      <div *ngIf="slides.length === 0" class="pb-carousel__placeholder">Carrossel sem slides</div>
      <div *ngIf="slides.length > 0" class="pb-carousel__track">
        <div *ngFor="let slide of slides; let i = index" class="pb-carousel__slide" [class.active]="i === activeIndex">
          <a *ngIf="slide.link" [href]="slide.link">
            <img [src]="slide.imageUrl" alt="Slide {{ i + 1 }}" loading="lazy" />
          </a>
          <img *ngIf="!slide.link" [src]="slide.imageUrl" alt="Slide {{ i + 1 }}" loading="lazy" />
        </div>
      </div>
      <div *ngIf="slides.length > 1" class="pb-carousel__dots">
        <button *ngFor="let slide of slides; let i = index"
          (click)="activeIndex = i"
          [class.active]="i === activeIndex"
          class="pb-carousel__dot">
        </button>
      </div>
    </div>
  `,
  styles: [`
    .pb-carousel { margin-bottom: 16px; position: relative; overflow: hidden; border-radius: 8px; }
    .pb-carousel__placeholder { background: #f5f5f5; padding: 60px; text-align: center; color: #999; border: 1px dashed #ddd; border-radius: 8px; }
    .pb-carousel__track { position: relative; }
    .pb-carousel__slide { display: none; }
    .pb-carousel__slide.active { display: block; }
    .pb-carousel__slide img { width: 100%; height: auto; display: block; border-radius: 8px; }
    .pb-carousel__dots { display: flex; justify-content: center; gap: 8px; padding: 12px 0; }
    .pb-carousel__dot { width: 10px; height: 10px; border-radius: 50%; border: none; background: #ddd; cursor: pointer; padding: 0; }
    .pb-carousel__dot.active { background: var(--color-primary, #4f46e5); }
  `]
})
export class CarouselBlockComponent {
  @Input() props: any = {};
  activeIndex = 0;

  get slides(): any[] {
    return Array.isArray(this.props?.items) ? this.props.items : [];
  }
}

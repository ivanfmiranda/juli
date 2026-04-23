import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-map-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pb-map" [style.height.px]="mapHeight">
      <iframe
        *ngIf="mapUrl"
        class="pb-map__iframe"
        [src]="mapUrl"
        frameborder="0"
        allowfullscreen
        loading="lazy"
        referrerpolicy="no-referrer-when-downgrade"
      ></iframe>
      <div *ngIf="!mapUrl && props?.address" class="pb-map__fallback">
        <p>{{ props.address }}</p>
      </div>
    </div>
  `,
  styles: [`
    .pb-map { position: relative; width: 100%; border-radius: 8px; overflow: hidden; margin-bottom: 16px; background: #e5e7eb; }
    .pb-map__iframe { width: 100%; height: 100%; border: none; }
    .pb-map__fallback { display: flex; align-items: center; justify-content: center; height: 100%; padding: 24px; text-align: center; color: #666; font-size: 15px; }
  `]
})
export class MapBlockComponent implements OnChanges {
  @Input() props: any = {};

  mapUrl: string = '';
  mapHeight: number = 400;

  ngOnChanges(): void {
    this.mapHeight = parseInt(this.props?.height, 10) || 400;
    this.mapUrl = this.buildMapUrl();
  }

  private buildMapUrl(): string {
    const lat = parseFloat(this.props?.lat);
    const lng = parseFloat(this.props?.lng);
    const zoom = parseInt(this.props?.zoom, 10) || 15;

    if (!isNaN(lat) && !isNaN(lng)) {
      return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;
    }

    if (this.props?.address) {
      return `https://maps.google.com/maps?q=${encodeURIComponent(this.props.address)}&z=${zoom}&output=embed`;
    }

    return '';
  }
}

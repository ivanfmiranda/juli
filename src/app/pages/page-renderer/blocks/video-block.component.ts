import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';

@Component({
  selector: 'app-video-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pb-video" *ngIf="embedUrl">
      <div class="pb-video__wrapper" [style.padding-top]="aspectPadding">
        <iframe
          class="pb-video__iframe"
          [src]="embedUrl"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      </div>
      <p *ngIf="props?.caption" class="pb-video__caption">{{ props.caption }}</p>
    </div>
  `,
  styles: [`
    .pb-video { margin-bottom: 16px; }
    .pb-video__wrapper { position: relative; width: 100%; overflow: hidden; border-radius: 8px; background: #000; }
    .pb-video__iframe { position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: none; }
    .pb-video__caption { margin: 8px 0 0; font-size: 14px; color: #666; text-align: center; }
  `]
})
export class VideoBlockComponent implements OnChanges {
  @Input() props: any = {};

  embedUrl: string = '';
  aspectPadding: string = '56.25%';

  ngOnChanges(): void {
    this.embedUrl = this.buildEmbedUrl(this.props?.videoUrl);
    this.aspectPadding = this.getAspectPadding(this.props?.aspectRatio);
  }

  private buildEmbedUrl(url: string): string {
    if (!url) return '';

    let videoId = '';
    let embedBase = '';

    // YouTube: youtube.com/watch?v=ID
    const ytWatchMatch = url.match(/(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/);
    // YouTube: youtu.be/ID
    const ytShortMatch = url.match(/(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    // YouTube: youtube.com/embed/ID
    const ytEmbedMatch = url.match(/(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
    // Vimeo: vimeo.com/ID
    const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/);

    if (ytWatchMatch) {
      videoId = ytWatchMatch[1];
      embedBase = `https://www.youtube.com/embed/${videoId}`;
    } else if (ytShortMatch) {
      videoId = ytShortMatch[1];
      embedBase = `https://www.youtube.com/embed/${videoId}`;
    } else if (ytEmbedMatch) {
      videoId = ytEmbedMatch[1];
      embedBase = `https://www.youtube.com/embed/${videoId}`;
    } else if (vimeoMatch) {
      videoId = vimeoMatch[1];
      embedBase = `https://player.vimeo.com/video/${videoId}`;
    } else {
      return '';
    }

    if (this.props?.autoplay) {
      embedBase += '?autoplay=1';
    }

    return embedBase;
  }

  private getAspectPadding(ratio: string): string {
    switch (ratio) {
      case '4:3': return '75%';
      case '1:1': return '100%';
      case '16:9':
      default: return '56.25%';
    }
  }
}

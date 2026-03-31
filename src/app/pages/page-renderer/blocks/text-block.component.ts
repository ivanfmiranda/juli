import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-text-block',
  template: `
    <div class="pb-text" [style.text-align]="props?.alignment || 'left'">
      <div *ngIf="props?.content" [innerHTML]="props.content"></div>
      <p *ngIf="!props?.content" class="pb-text__placeholder">Bloco de texto vazio</p>
    </div>
  `,
  styles: [`
    .pb-text { padding: 16px 0; margin-bottom: 16px; line-height: 1.7; font-size: 16px; color: #333; }
    .pb-text__placeholder { color: #999; font-style: italic; }
  `]
})
export class TextBlockComponent {
  @Input() props: any = {};
}

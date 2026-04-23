import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-html-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="pb-html">
      <div *ngIf="props?.html" [innerHTML]="props.html"></div>
      <p *ngIf="!props?.html" class="pb-html__placeholder">Bloco HTML vazio</p>
    </div>
  `,
  styles: [`
    .pb-html { margin-bottom: 16px; }
    .pb-html__placeholder { color: #999; font-style: italic; padding: 24px; background: #f9f9f9; border: 1px dashed #ddd; border-radius: 8px; text-align: center; }
  `]
})
export class HtmlBlockComponent {
  @Input() props: any = {};
}

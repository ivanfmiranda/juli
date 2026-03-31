import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-spacer-block',
  template: `<div [style.height.px]="height"></div>`,
})
export class SpacerBlockComponent {
  @Input() props: any = {};

  get height(): number {
    return parseInt(this.props?.height, 10) || 40;
  }
}

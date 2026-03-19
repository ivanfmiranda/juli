import { ChangeDetectionStrategy, Component } from '@angular/core';
import { JuliCartFacade } from '../../core/commerce';

@Component({
  selector: 'app-cart-page',
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CartPageComponent {
  readonly cart$ = this.cartFacade.cart$;
  readonly itemCount$ = this.cartFacade.itemCount$;
  readonly loading$ = this.cartFacade.loading$;

  constructor(private readonly cartFacade: JuliCartFacade) {
    this.cartFacade.reload().subscribe({ error: () => undefined });
  }
}
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WishlistService } from '../../core/commerce/services/wishlist.service';
import { JuliCartFacade } from '../../core/commerce';
import { JuliI18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-wishlist-page',
  templateUrl: './wishlist-page.component.html',
  styleUrls: ['./wishlist-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WishlistPageComponent implements OnInit {

  readonly items$ = this.wishlist.items$;
  readonly loading$ = this.wishlist.loading$;

  constructor(
    readonly wishlist: WishlistService,
    private readonly cartFacade: JuliCartFacade,
    private readonly router: Router,
    private readonly i18n: JuliI18nService,
  ) {}

  ngOnInit(): void {
    this.wishlist.load();
  }

  removeItem(sku: string): void {
    this.wishlist.remove(sku).subscribe({ error: () => {} });
  }

  addToCart(productCode: string): void {
    this.cartFacade.addEntry(productCode, 1).subscribe({
      next: () => this.router.navigate(['/cart']),
      error: () => {}
    });
  }
}

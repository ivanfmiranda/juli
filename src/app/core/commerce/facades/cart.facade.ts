import { Injectable } from '@angular/core';
import { Cart } from '@spartacus/core';
import { BehaviorSubject, forkJoin, Observable, of } from 'rxjs';
import { catchError, filter, finalize, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { UbrisProductConnector } from '../connectors/product.connector';
import { UbrisCartConnector } from '../connectors/cart.connector';

@Injectable({ providedIn: 'root' })
export class JuliCartFacade {
  private readonly cartSubject = new BehaviorSubject<Cart | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private cartId: string | null = null;

  readonly cart$ = this.cartSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly itemCount$ = this.cart$.pipe(
    map(cart => (cart?.entries ?? []).reduce((sum, entry) => sum + (entry.quantity ?? 0), 0))
  );

  constructor(
    private readonly authService: AuthService,
    private readonly connector: UbrisCartConnector,
    private readonly productConnector: UbrisProductConnector
  ) {
    this.authService.session$.subscribe(session => {
      if (!session) {
        this.cartId = null;
        this.cartSubject.next(null);
        return;
      }
      this.cartId = localStorage.getItem(this.storageKey(session.username));
      if (this.cartId) {
        this.reload().subscribe();
      }
    });
  }

  ensureCart(): Observable<Cart> {
    const session = this.authService.currentSession;
    if (!session) {
      throw new Error('Authentication required');
    }

    if (this.cartId) {
      this.loadingSubject.next(true);
      return this.connector.load(this.cartId).pipe(
        switchMap(cart => this.enrichEntries(cart)),
        tap(cart => this.cartSubject.next(cart)),
        finalize(() => this.loadingSubject.next(false))
      );
    }

    this.loadingSubject.next(true);
    return this.connector.create(session.username).pipe(
      switchMap(cart => this.enrichEntries(cart)),
      tap(cart => {
        this.cartId = cart.code ?? null;
        if (this.cartId) {
          localStorage.setItem(this.storageKey(session.username), this.cartId);
        }
        this.cartSubject.next(cart);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  addEntry(productCode: string, quantity: number = 1): Observable<Cart> {
    return this.ensureCart().pipe(
      switchMap(cart => this.connector.addEntry(cart.code || '', productCode, quantity)),
      switchMap(() => this.reload())
    );
  }

  reload(): Observable<Cart> {
    if (!this.cartId) {
      return of(this.cartSubject.value as Cart).pipe(filter((cart): cart is Cart => !!cart));
    }

    this.loadingSubject.next(true);
    return this.connector.load(this.cartId).pipe(
      switchMap(cart => this.enrichEntries(cart)),
      tap(cart => {
        this.cartSubject.next(cart);
      }),
      finalize(() => this.loadingSubject.next(false))
    );
  }

  clear(): void {
    const session = this.authService.currentSession;
    if (session) {
      localStorage.removeItem(this.storageKey(session.username));
    }
    this.cartId = null;
    this.cartSubject.next(null);
  }

  get currentCartId(): string | null {
    return this.cartId;
  }

  private storageKey(username: string): string {
    return `juli.cart.${username}`;
  }

  private enrichEntries(cart: Cart): Observable<Cart> {
    const entries = cart.entries ?? [];
    if (entries.length === 0) {
      return of(cart);
    }

    return forkJoin(entries.map((entry) => {
      const productCode = entry.product?.code;
      if (!productCode) {
        return of(entry);
      }

      return this.productConnector.get(productCode).pipe(
        map((product) => ({
          ...entry,
          product: {
            ...entry.product,
            code: productCode,
            name: product.name ?? entry.product?.name ?? productCode
          }
        })),
        catchError(() => of(entry))
      );
    })).pipe(
      map((enrichedEntries) => ({
        ...cart,
        entries: enrichedEntries
      }))
    );
  }
}

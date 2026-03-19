import { Injectable } from '@angular/core';
import { Cart, MultiCartService } from '@spartacus/core';
import { BehaviorSubject, EMPTY, Observable, combineLatest, forkJoin, of, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, scan, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { UbrisProductConnector } from '../connectors/product.connector';
import { JuliCartIdStorageService } from '../services/cart-id.storage.service';

@Injectable({ providedIn: 'root' })
export class JuliCartFacade {
  private readonly cartIdSubject = new BehaviorSubject<string | null>(null);

  readonly cart$ = combineLatest([this.authService.session$, this.cartIdSubject]).pipe(
    switchMap(([session, cartId]) => {
      if (!session || !cartId) {
        return of<Cart | null>(null);
      }

      return this.multiCartService.getCart(cartId).pipe(
        switchMap(cart => cart ? this.enrichEntries(cart) : of<Cart | null>(null))
      );
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly loading$ = combineLatest([this.authService.session$, this.cartIdSubject]).pipe(
    switchMap(([session, cartId]) => {
      if (!session || !cartId) {
        return of(false);
      }

      return this.multiCartService.getCartEntity(cartId).pipe(
        map(entity => !!entity.loading || (entity.processesCount ?? 0) > 0)
      );
    }),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );
  readonly itemCount$ = this.cart$.pipe(
    map(cart => (cart?.entries ?? []).reduce((sum, entry) => sum + (entry.quantity ?? 0), 0))
  );

  constructor(
    private readonly authService: AuthService,
    private readonly multiCartService: MultiCartService,
    private readonly productConnector: UbrisProductConnector,
    private readonly cartIdStorage: JuliCartIdStorageService
  ) {
    this.authService.session$.subscribe(session => {
      if (!session) {
        this.cartIdSubject.next(null);
        return;
      }

      const storedCartId = this.cartIdStorage.read(session.username);
      this.cartIdSubject.next(storedCartId);
      if (storedCartId) {
        this.multiCartService.loadCart({
          userId: session.username,
          cartId: storedCartId
        });
      }
    });
  }

  ensureCart(): Observable<Cart> {
    const session = this.authService.currentSession;
    if (!session) {
      throw new Error('Authentication required');
    }

    const cartId = this.cartIdSubject.value;
    if (cartId) {
      this.multiCartService.loadCart({
        userId: session.username,
        cartId
      });
      return this.waitForReadyCart(cartId).pipe(
        catchError(() => {
          this.resetCart(session.username);
          return this.createCart(session.username);
        })
      );
    }

    return this.createCart(session.username);
  }

  addEntry(productCode: string, quantity: number = 1): Observable<Cart> {
    const session = this.authService.currentSession;
    if (!session) {
      throw new Error('Authentication required');
    }

    return this.ensureCart().pipe(
      switchMap(cart => {
        const cartId = cart.code;
        if (!cartId) {
          return throwError(() => new Error('Cart id is missing'));
        }

        this.multiCartService.addEntry(session.username, cartId, productCode, quantity);
        return this.waitForCartMutation(cartId);
      })
    );
  }

  reload(): Observable<Cart> {
    const session = this.authService.currentSession;
    const cartId = this.cartIdSubject.value;
    if (!session || !cartId) {
      return EMPTY;
    }

    this.multiCartService.loadCart({
      userId: session.username,
      cartId
    });
    return this.waitForReadyCart(cartId);
  }

  clear(): void {
    const session = this.authService.currentSession;
    const cartId = this.cartIdSubject.value;
    if (session && cartId) {
      this.multiCartService.deleteCart(cartId, session.username);
      this.cartIdStorage.clear(session.username);
      this.cartIdSubject.next(null);
      return;
    }

    if (session) {
      this.cartIdStorage.clear(session.username);
    }
    this.cartIdSubject.next(null);
  }

  get currentCartId(): string | null {
    return this.cartIdSubject.value;
  }

  private createCart(userId: string): Observable<Cart> {
    return this.multiCartService.createCart({ userId }).pipe(
      filter(entity => !entity.loading),
      switchMap(entity => {
        const cart = entity.value;
        if (entity.error || !cart?.code) {
          return throwError(() => new Error('Cart creation failed'));
        }

        this.cartIdStorage.write(userId, cart.code);
        this.cartIdSubject.next(cart.code);
        return of(cart);
      }),
      take(1)
    );
  }

  private waitForReadyCart(cartId: string): Observable<Cart> {
    return this.multiCartService.getCartEntity(cartId).pipe(
      filter(entity => !entity.loading),
      switchMap(entity => {
        if (entity.error && !entity.value) {
          return throwError(() => new Error('Cart load failed'));
        }
        if (entity.value && (entity.processesCount ?? 0) === 0) {
          return of(entity.value);
        }
        return EMPTY;
      }),
      take(1)
    );
  }

  private waitForCartMutation(cartId: string): Observable<Cart> {
    return this.multiCartService.getCartEntity(cartId).pipe(
      scan((state, entity) => ({
        busyObserved: state.busyObserved || !!entity.loading || (entity.processesCount ?? 0) > 0,
        entity
      }), {
        busyObserved: false,
        entity: {} as { loading?: boolean; error?: boolean; value?: Cart; processesCount?: number }
      }),
      switchMap(state => {
        const entity = state.entity;
        if (!state.busyObserved) {
          return EMPTY;
        }
        if (entity.error && !entity.loading && !entity.value) {
          return throwError(() => new Error('Cart update failed'));
        }
        if (entity.value && !entity.loading && (entity.processesCount ?? 0) === 0) {
          return of(entity.value);
        }
        return EMPTY;
      }),
      take(1)
    );
  }

  private resetCart(userId: string): void {
    this.cartIdStorage.clear(userId);
    this.cartIdSubject.next(null);
  }

  private enrichEntries(cart: Cart): Observable<Cart | null> {
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

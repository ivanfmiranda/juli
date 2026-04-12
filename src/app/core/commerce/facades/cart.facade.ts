import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, Observable, combineLatest, forkJoin, of, throwError } from 'rxjs';
import { catchError, distinctUntilChanged, filter, finalize, map, shareReplay, switchMap, take, tap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { UbrisProductConnector } from '../connectors/product.connector';
import { JuliCartIdStorageService } from '../services/cart-id.storage.service';
import { AnonymousCartStorageService } from '../services/anonymous-cart-storage.service';
import { UbrisCartConnector } from '../connectors/cart.connector';

/** Minimal cart entry shape used across the Juli storefront */
export interface JuliCartEntry {
  entryNumber?: number;
  quantity?: number;
  product?: { code?: string; name?: string };
  basePrice?: { value?: number; currencyIso?: string; formattedValue?: string };
  totalPrice?: { value?: number; currencyIso?: string; formattedValue?: string };
  updateable?: boolean;
  customizations?: unknown;
  [key: string]: unknown;
}

/** Minimal cart shape used across the Juli storefront */
export interface JuliCart {
  code?: string;
  entries?: JuliCartEntry[];
  subTotal?: { value?: number; currencyIso?: string; formattedValue?: string };
  totalTax?: { value?: number; currencyIso?: string; formattedValue?: string };
  totalPrice?: { value?: number; currencyIso?: string; formattedValue?: string };
  totalDiscounts?: { value?: number; currencyIso?: string; formattedValue?: string };
  totalItems?: number;
  totalUnitCount?: number;
  [key: string]: unknown;
}

export interface CartPromotionResult {
  cart: JuliCart;
  mergeOccurred: boolean;
  cartChanged: boolean;
  warnings: any[];
}

/**
 * Cart state types
 * - UNAUTHENTICATED: no session, no anonymous cart
 * - ANONYMOUS: has anonymous principal and cart
 * - AUTHENTICATED: has JWT session (cart may be promoted from anonymous or new)
 */
export type CartStateType = 'UNAUTHENTICATED' | 'ANONYMOUS' | 'AUTHENTICATED';

@Injectable({ providedIn: 'root' })
export class JuliCartFacade {
  private readonly cartIdSubject = new BehaviorSubject<string | null>(null);
  private readonly anonymousCartIdSubject = new BehaviorSubject<string | null>(null);
  private readonly anonymousCartSubject = new BehaviorSubject<JuliCart | null>(null);
  private readonly anonymousCartLoadingSubject = new BehaviorSubject<boolean>(false);
  private readonly cartDeleteReady$ = new BehaviorSubject<boolean>(true);
  private readonly authenticatedCartSubject = new BehaviorSubject<JuliCart | null>(null);
  private readonly authenticatedCartLoadingSubject = new BehaviorSubject<boolean>(false);

  /**
   * Observable that emits the current cart state type
   */
  readonly cartStateType$: Observable<CartStateType> = combineLatest([
    this.authService.session$,
    this.authService.anonymousPrincipal$,
    this.anonymousCartIdSubject
  ]).pipe(
    map(([session, anonymousPrincipal, anonymousCartId]) => {
      if (session) {
        return 'AUTHENTICATED';
      }
      if (anonymousPrincipal && anonymousCartId) {
        return 'ANONYMOUS';
      }
      return 'UNAUTHENTICATED';
    }),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly cart$ = combineLatest([
    this.authService.session$,
    this.cartIdSubject,
    this.anonymousCartIdSubject,
    this.authService.anonymousPrincipal$
  ]).pipe(
    switchMap(([session, cartId, anonymousCartId, anonymousPrincipal]) => {
      // Authenticated flow
      if (session && cartId) {
        return this.authenticatedCartSubject.pipe(
          switchMap(cart => cart ? this.enrichEntries(cart) : of<JuliCart | null>(null))
        );
      }

      // Anonymous flow
      if (anonymousPrincipal && anonymousCartId) {
        return this.anonymousCartSubject.pipe(
          switchMap(cart => cart ? this.enrichEntries(cart) : of<JuliCart | null>(null))
        );
      }

      return of<JuliCart | null>(null);
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly loading$ = combineLatest([
    this.authService.session$,
    this.cartIdSubject,
    this.anonymousCartIdSubject,
    this.authService.anonymousPrincipal$
  ]).pipe(
    switchMap(([session, cartId, anonymousCartId, anonymousPrincipal]) => {
      if (session && cartId) {
        return this.authenticatedCartLoadingSubject.asObservable();
      }
      if (anonymousPrincipal && anonymousCartId) {
        return this.anonymousCartLoadingSubject.asObservable();
      }
      return of(false);
    }),
    distinctUntilChanged(),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  readonly itemCount$ = this.cart$.pipe(
    map(cart => (cart?.entries ?? []).reduce((sum, entry) => sum + (entry.quantity ?? 0), 0))
  );

  constructor(
    private readonly authService: AuthService,
    private readonly productConnector: UbrisProductConnector,
    private readonly cartIdStorage: JuliCartIdStorageService,
    private readonly anonymousCartStorage: AnonymousCartStorageService,
    private readonly cartConnector: UbrisCartConnector
  ) {
    // Subscribe to auth session changes
    this.authService.session$.subscribe(session => {
      if (!session) {
        this.cartIdSubject.next(null);
        this.authenticatedCartSubject.next(null);
        // Don't clear anonymous cart on logout - it persists until explicitly cleared or promoted
        this.restoreAnonymousCart();
        return;
      }

      // Authenticated: load existing cart.
      // Cart promotion is handled exclusively by LoginComponent to avoid race conditions.
      this.loadOrCreateAuthenticatedCart(session.username);
    });

    // Initialize anonymous cart if exists
    this.restoreAnonymousCart();
  }

  /**
   * Creates an anonymous cart for unauthenticated users.
   * Generates anonymousId via authService, creates cart via connector,
   * and stores in AnonymousCartStorageService.
   */
  createAnonymousCart(): Observable<JuliCart> {
    const anonymousPrincipal = this.authService.createAnonymousPrincipal();
    const anonymousId = anonymousPrincipal.anonymousId;

    this.anonymousCartLoadingSubject.next(true);

    // Fetch a server-signed HMAC token before creating the cart
    return this.cartConnector.fetchAnonymousToken(anonymousId).pipe(
      switchMap(anonymousToken =>
        this.cartConnector.createAnonymous(anonymousToken).pipe(
          tap(cart => {
            if (cart.code) {
              this.anonymousCartStorage.write(anonymousId, cart.code, anonymousToken);
              this.anonymousCartIdSubject.next(cart.code);
            }
            this.anonymousCartSubject.next(cart as JuliCart);
          })
        )
      ),
      map(cart => cart as JuliCart),
      finalize(() => this.anonymousCartLoadingSubject.next(false))
    );
  }

  /**
   * Ensures a cart exists for the current user state.
   * - If authenticated: uses existing logic with bearer token
   * - If not authenticated and no anonymous cart: creates anonymous cart
   * - If not authenticated and has anonymous cart: loads it
   */
  ensureCart(): Observable<JuliCart> {
    const session = this.authService.currentSession;

    // Authenticated flow
    if (session) {
      return this.ensureAuthenticatedCart(session.username);
    }

    // Anonymous flow
    return this.ensureAnonymousCart();
  }

  /**
   * Adds an entry to the cart.
   * - If authenticated: uses existing logic with bearer token
   * - If anonymous: uses anonymousId header
   */
  addEntry(productCode: string, quantity: number = 1): Observable<JuliCart> {
    const session = this.authService.currentSession;

    if (session) {
      // Authenticated flow
      return this.ensureCart().pipe(
        switchMap(cart => {
          const cartId = cart.code;
          if (!cartId) {
            return throwError(new Error('Cart id is missing'));
          }

          return this.cartConnector.addEntry(cartId, productCode, quantity).pipe(
            switchMap(() => this.reloadAuthenticated(cartId))
          );
        })
      );
    }

    // Anonymous flow
    return this.ensureCart().pipe(
      switchMap(cart => {
        const cartId = cart.code;
        if (!cartId) {
          return throwError(new Error('Cart id is missing'));
        }

        const anonymousToken = this.anonymousCartStorage.getAnonymousToken();
        if (!anonymousToken) {
          return throwError(new Error('Anonymous token is missing'));
        }

        return this.cartConnector.addEntryAnonymous(cartId, productCode, quantity, anonymousToken).pipe(
          switchMap(() => this.loadAnonymousCart(cartId, anonymousToken))
        );
      })
    );
  }

  updateEntry(entryNumber: string | number, quantity: number): Observable<JuliCart> {
    const session = this.authService.currentSession;
    const cartId = this.cartIdSubject.value;

    if (session && cartId) {
      return this.cartConnector.updateEntry(cartId, entryNumber, quantity).pipe(
        switchMap(() => this.reload())
      );
    }

    const anonymousCartId = this.anonymousCartIdSubject.value;
    const anonymousToken = this.anonymousCartStorage.getAnonymousToken();
    if (anonymousCartId && anonymousToken) {
      return this.cartConnector.updateEntryAnonymous(anonymousCartId, entryNumber, quantity, anonymousToken).pipe(
        switchMap(() => this.loadAnonymousCart(anonymousCartId, anonymousToken))
      );
    }

    return EMPTY;
  }

  removeEntry(entryNumber: string | number): Observable<JuliCart> {
    const session = this.authService.currentSession;
    const cartId = this.cartIdSubject.value;

    if (session && cartId) {
      return this.cartConnector.removeEntry(cartId, entryNumber).pipe(
        switchMap(() => this.reload())
      );
    }

    const anonymousCartId = this.anonymousCartIdSubject.value;
    const anonymousToken = this.anonymousCartStorage.getAnonymousToken();
    if (anonymousCartId && anonymousToken) {
      return this.cartConnector.removeEntryAnonymous(anonymousCartId, entryNumber, anonymousToken).pipe(
        switchMap(() => this.loadAnonymousCart(anonymousCartId, anonymousToken))
      );
    }

    return EMPTY;
  }

  /**
   * Promotes an anonymous cart to an authenticated cart upon login.
   * Calls connector to POST /cart/promote, clears anonymous storage after success,
   * and stores new cartId in regular cart storage.
   */
  promoteAnonymousCart(): Observable<CartPromotionResult> {
    const session = this.authService.currentSession;
    if (!session) {
      return throwError(new Error('Authentication required for cart promotion'));
    }

    const anonymousToken = this.anonymousCartStorage.getAnonymousToken();
    if (!anonymousToken) {
      return throwError(new Error('No anonymous cart to promote'));
    }

    const anonymousCartId = this.anonymousCartIdSubject.value ?? this.anonymousCartStorage.getCartId();
    if (!anonymousCartId) {
      return throwError(new Error('No anonymous cart ID found for promotion'));
    }

    return this.cartConnector.promoteAnonymousCart(anonymousCartId, anonymousToken, session.username).pipe(
      tap(result => {
        // Clear anonymous storage after successful promotion
        this.anonymousCartStorage.clearAfterPromotion();
        this.authService.clearAnonymousPrincipal();
        this.anonymousCartIdSubject.next(null);
        this.anonymousCartSubject.next(null);

        // Store new cartId and update authenticated cart subject
        if (result.cart.code) {
          this.cartIdStorage.write(session.username, result.cart.code);
          this.cartIdSubject.next(result.cart.code);
          this.authenticatedCartSubject.next(result.cart as JuliCart);
        }
      }),
      map(result => result as CartPromotionResult)
    );
  }

  /**
   * Gets the current cart (authenticated or anonymous).
   */
  getCart(): Observable<JuliCart | null> {
    return this.cart$;
  }

  /**
   * Checks if the current cart is an anonymous cart.
   */
  isAnonymousCart(): boolean {
    return !this.authService.isAuthenticated && this.anonymousCartIdSubject.value !== null;
  }

  /**
   * Gets the anonymous cart ID if one exists.
   */
  getAnonymousCartId(): string | null {
    return this.anonymousCartIdSubject.value;
  }

  reload(): Observable<JuliCart> {
    const session = this.authService.currentSession;
    const cartId = this.cartIdSubject.value;

    if (session && cartId) {
      return this.reloadAuthenticated(cartId);
    }

    // Anonymous reload
    const anonymousCartId = this.anonymousCartIdSubject.value;
    const anonymousToken = this.anonymousCartStorage.getAnonymousToken();

    if (anonymousToken && anonymousCartId) {
      return this.loadAnonymousCart(anonymousCartId, anonymousToken);
    }

    return EMPTY;
  }

  clear(): void {
    const session = this.authService.currentSession;
    const cartId = this.cartIdSubject.value;

    if (session && cartId) {
      // Delete cart on backend — gate prevents createCart() from racing
      this.cartDeleteReady$.next(false);
      this.cartConnector.delete(cartId).pipe(
        catchError(() => of(undefined)),
        finalize(() => this.cartDeleteReady$.next(true))
      ).subscribe();
      this.cartIdStorage.clear(session.username);
      this.cartIdSubject.next(null);
      this.authenticatedCartSubject.next(null);
      this.anonymousCartSubject.next(null);
      return;
    }

    if (session) {
      this.cartIdStorage.clear(session.username);
    }

    // Clear anonymous cart
    const anonymousCartId = this.anonymousCartIdSubject.value;
    const anonymousToken = this.anonymousCartStorage.getAnonymousToken();

    if (anonymousCartId && anonymousToken) {
      this.cartConnector.deleteAnonymous(anonymousCartId, anonymousToken).subscribe({
        error: () => {
          // Silently fail - cart may already be expired
        }
      });
    }

    this.anonymousCartStorage.clear();
    this.authService.clearAnonymousPrincipal();
    this.anonymousCartIdSubject.next(null);
    this.anonymousCartSubject.next(null);
    this.anonymousCartLoadingSubject.next(false);
    this.cartIdSubject.next(null);
  }

  discardAnonymousCart(): void {
    const anonymousCartId = this.anonymousCartIdSubject.value;
    const anonymousToken = this.anonymousCartStorage.getAnonymousToken();

    if (anonymousCartId && anonymousToken) {
      this.cartConnector.deleteAnonymous(anonymousCartId, anonymousToken).subscribe({
        error: () => {
          // Local cleanup still matters even if the server-side cart already expired.
        }
      });
    }

    this.anonymousCartStorage.clear();
    this.authService.clearAnonymousPrincipal();
    this.anonymousCartIdSubject.next(null);
    this.anonymousCartSubject.next(null);
    this.anonymousCartLoadingSubject.next(false);
  }

  get currentCartId(): string | null {
    if (this.authService.isAuthenticated) {
      return this.cartIdSubject.value;
    }
    return this.anonymousCartIdSubject.value;
  }

  private ensureAuthenticatedCart(userId: string): Observable<JuliCart> {
    return this.cartDeleteReady$.pipe(
      filter(ready => ready),
      take(1),
      switchMap(() => {
        const cartId = this.cartIdSubject.value;
        if (cartId) {
          const current = this.authenticatedCartSubject.value;
          if (current) {
            return of(current);
          }
          return this.reloadAuthenticated(cartId).pipe(
            catchError(() => {
              this.resetCart(userId);
              return this.createCart(userId);
            })
          );
        }
        return this.createCart(userId);
      })
    );
  }

  private ensureAnonymousCart(): Observable<JuliCart> {
    const storedAnonymousCart = this.anonymousCartStorage.read();

    // Has existing anonymous cart
    if (storedAnonymousCart?.anonymousToken) {
      const cartId = storedAnonymousCart.cartId;
      this.anonymousCartIdSubject.next(cartId);

      return this.loadAnonymousCart(cartId, storedAnonymousCart.anonymousToken).pipe(
        catchError(() => {
          // Cart may have expired, create new one
          this.anonymousCartStorage.clear();
          this.anonymousCartSubject.next(null);
          return this.createAnonymousCart();
        })
      );
    }

    // No anonymous cart exists, create one
    return this.createAnonymousCart();
  }

  private createCart(userId: string): Observable<JuliCart> {
    this.authenticatedCartLoadingSubject.next(true);
    return this.cartConnector.create(userId).pipe(
      tap(cart => {
        if (cart.code) {
          this.cartIdStorage.write(userId, cart.code);
          this.cartIdSubject.next(cart.code);
          this.authenticatedCartSubject.next(cart as JuliCart);
        }
      }),
      map(cart => {
        if (!cart.code) {
          throw new Error('Cart creation failed');
        }
        return cart as JuliCart;
      }),
      finalize(() => this.authenticatedCartLoadingSubject.next(false))
    );
  }

  private reloadAuthenticated(cartId: string): Observable<JuliCart> {
    this.authenticatedCartLoadingSubject.next(true);
    return this.cartConnector.load(cartId).pipe(
      tap(cart => this.authenticatedCartSubject.next(cart as JuliCart)),
      map(cart => cart as JuliCart),
      finalize(() => this.authenticatedCartLoadingSubject.next(false))
    );
  }

  private resetCart(userId: string): void {
    this.cartIdStorage.clear(userId);
    this.cartIdSubject.next(null);
    this.authenticatedCartSubject.next(null);
  }

  private loadOrCreateAuthenticatedCart(username: string): void {
    const storedCartId = this.cartIdStorage.read(username);
    this.cartIdSubject.next(storedCartId);
    if (storedCartId) {
      this.reloadAuthenticated(storedCartId).pipe(
        catchError(() => {
          this.resetCart(username);
          return EMPTY;
        })
      ).subscribe();
    }
  }

  private restoreAnonymousCart(): void {
    const storedCart = this.anonymousCartStorage.read();
    if (storedCart) {
      this.anonymousCartIdSubject.next(storedCart.cartId);

      // Also restore anonymous principal if not already present
      const currentAnonymousPrincipal = this.authService.currentAnonymousPrincipal;
      if (!currentAnonymousPrincipal) {
        // Restore anonymous principal with the stored anonymousId
        this.authService.restoreAnonymousPrincipalWithId(storedCart.anonymousId);
      }
    }
  }

  private loadAnonymousCart(cartId: string, anonymousToken: string): Observable<JuliCart> {
    this.anonymousCartLoadingSubject.next(true);

    return this.cartConnector.loadAnonymous(cartId, anonymousToken).pipe(
      tap(cart => {
        this.anonymousCartIdSubject.next(cart.code ?? cartId);
        this.anonymousCartSubject.next(cart as JuliCart);
      }),
      map(cart => cart as JuliCart),
      finalize(() => this.anonymousCartLoadingSubject.next(false))
    );
  }

  private enrichEntries(cart: JuliCart): Observable<JuliCart | null> {
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
            name: (product as any).name ?? entry.product?.name ?? productCode
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

import { BehaviorSubject, of, EMPTY, Subject } from 'rxjs';
import { skip, take } from 'rxjs/operators';
import { JuliCartFacade, JuliCart } from '../cart.facade';
import { AuthService } from '../../../auth/auth.service';
import { JuliCartIdStorageService } from '../../services/cart-id.storage.service';
import { AnonymousCartStorageService } from '../../services/anonymous-cart-storage.service';
import { UbrisCartConnector } from '../../connectors/cart.connector';

describe('JuliCartFacade', () => {
  let authService: jasmine.SpyObj<AuthService>;
  let cartConnector: jasmine.SpyObj<UbrisCartConnector>;
  let cartIdStorage: jasmine.SpyObj<JuliCartIdStorageService>;
  let anonymousCartStorage: jasmine.SpyObj<AnonymousCartStorageService>;

  let sessionSubject: BehaviorSubject<any>;
  let anonymousPrincipalSubject: BehaviorSubject<any>;

  const mockSession = {
    accessToken: 'token-abc',
    tokenType: 'Bearer',
    expiresIn: 3600,
    username: 'user@test.com',
    roles: ['ROLE_USER']
  };

  const mockAnonymousPrincipal = {
    anonymousId: 'anon-uuid-123',
    principalType: 'ANONYMOUS' as const,
    createdAt: new Date()
  };

  const mockCart: JuliCart = {
    code: 'cart-001',
    entries: [
      { entryNumber: 0, quantity: 2, product: { code: 'SKU-A', name: 'Produto A' },
        basePrice: { value: 50, formattedValue: 'R$ 50,00' },
        totalPrice: { value: 100, formattedValue: 'R$ 100,00' } },
      { entryNumber: 1, quantity: 1, product: { code: 'SKU-B', name: 'Produto B' },
        basePrice: { value: 75, formattedValue: 'R$ 75,00' },
        totalPrice: { value: 75, formattedValue: 'R$ 75,00' } }
    ],
    subTotal: { value: 175, formattedValue: 'R$ 175,00' },
    totalPrice: { value: 175, formattedValue: 'R$ 175,00' }
  };

  const mockAnonymousToken = 'signed-anon-token-xyz';

  const storedAnonymousCart = {
    anonymousToken: mockAnonymousToken,
    anonymousId: 'anon-uuid-123',
    cartId: 'anon-cart-456',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };

  function buildFacade(): JuliCartFacade {
    return new JuliCartFacade(authService, cartIdStorage, anonymousCartStorage, cartConnector);
  }

  beforeEach(() => {
    sessionSubject = new BehaviorSubject<any>(null);
    anonymousPrincipalSubject = new BehaviorSubject<any>(null);

    authService = jasmine.createSpyObj('AuthService', [
      'createAnonymousPrincipal',
      'clearAnonymousPrincipal',
      'restoreAnonymousPrincipalWithId'
    ], {
      session$: sessionSubject.asObservable(),
      anonymousPrincipal$: anonymousPrincipalSubject.asObservable()
    });
    // Jasmine 3.x cria getter spies para o 3º argumento — propriedades que
    // precisam ser sobrescritas diretamente devem ser definidas como writable.
    Object.defineProperty(authService, 'currentSession', { value: null, writable: true, configurable: true });
    Object.defineProperty(authService, 'isAuthenticated', { value: false, writable: true, configurable: true });
    Object.defineProperty(authService, 'currentAnonymousPrincipal', { value: null, writable: true, configurable: true });

    cartIdStorage = jasmine.createSpyObj('JuliCartIdStorageService', ['read', 'write', 'clear']);
    cartIdStorage.read.and.returnValue(null);

    anonymousCartStorage = jasmine.createSpyObj('AnonymousCartStorageService', [
      'read', 'write', 'clear', 'clearAfterPromotion',
      'getAnonymousToken', 'getAnonymousId', 'getCartId', 'exists'
    ]);
    anonymousCartStorage.read.and.returnValue(null);
    anonymousCartStorage.getAnonymousToken.and.returnValue(null);
    anonymousCartStorage.getCartId.and.returnValue(null);

    cartConnector = jasmine.createSpyObj('UbrisCartConnector', [
      'load', 'create', 'createAnonymous', 'loadAnonymous', 'fetchAnonymousToken',
      'addEntry', 'addEntryAnonymous',
      'updateEntry', 'updateEntryAnonymous',
      'removeEntry', 'removeEntryAnonymous',
      'delete', 'deleteAnonymous', 'promoteAnonymousCart'
    ]);
  });

  // ─────────────────────────────────────────────
  // cartStateType$
  // ─────────────────────────────────────────────

  describe('cartStateType$', () => {
    it('should emit UNAUTHENTICATED when there is no session and no anonymous principal', (done) => {
      const facade = buildFacade();
      facade.cartStateType$.pipe(take(1)).subscribe(state => {
        expect(state).toBe('UNAUTHENTICATED');
        done();
      });
    });

    it('should emit AUTHENTICATED when session is present', (done) => {
      sessionSubject.next(mockSession);
      const facade = buildFacade();
      facade.cartStateType$.pipe(take(1)).subscribe(state => {
        expect(state).toBe('AUTHENTICATED');
        done();
      });
    });

    it('should emit ANONYMOUS when anonymous principal and cart ID are both set', (done) => {
      anonymousCartStorage.read.and.returnValue(storedAnonymousCart);
      anonymousPrincipalSubject.next(mockAnonymousPrincipal);
      const facade = buildFacade();

      facade.cartStateType$.pipe(take(1)).subscribe(state => {
        expect(state).toBe('ANONYMOUS');
        done();
      });
    });

    it('should transition from UNAUTHENTICATED to AUTHENTICATED when session is set', (done) => {
      const facade = buildFacade();
      const states: string[] = [];

      facade.cartStateType$.pipe(take(2)).subscribe({
        next: state => states.push(state),
        complete: () => {
          expect(states).toEqual(['UNAUTHENTICATED', 'AUTHENTICATED']);
          done();
        }
      });

      sessionSubject.next(mockSession);
    });
  });

  // ─────────────────────────────────────────────
  // cart$
  // ─────────────────────────────────────────────

  describe('cart$', () => {
    it('should emit null when unauthenticated and no anonymous cart', (done) => {
      const facade = buildFacade();
      facade.cart$.pipe(take(1)).subscribe(cart => {
        expect(cart).toBeNull();
        done();
      });
    });

    it('should emit authenticated cart after reload without blocking on product HTTP calls', (done) => {
      // Regression test: removing enrichEntries means cart$ emits immediately from subject
      sessionSubject.next(mockSession);
      (authService as any).currentSession = mockSession;
      cartIdStorage.read.and.returnValue('cart-001');
      cartConnector.load.and.returnValue(of(mockCart));

      const facade = buildFacade();

      // reload() updates authenticatedCartSubject, which cart$ reads directly
      facade.reload().subscribe(() => {
        facade.cart$.pipe(take(1)).subscribe(cart => {
          expect(cart).not.toBeNull();
          expect(cart?.code).toBe('cart-001');
          expect(cart?.entries?.length).toBe(2);
          // No product connector involved — no enrichment HTTP calls
          done();
        });
      });
    });

    it('should emit anonymous cart after reload without blocking on product HTTP calls', (done) => {
      anonymousCartStorage.read.and.returnValue(storedAnonymousCart);
      anonymousCartStorage.getAnonymousToken.and.returnValue(mockAnonymousToken);
      anonymousPrincipalSubject.next(mockAnonymousPrincipal);
      cartConnector.loadAnonymous.and.returnValue(of({ ...mockCart, code: 'anon-cart-456' }));

      const facade = buildFacade();

      facade.reload().subscribe(() => {
        facade.cart$.pipe(take(1)).subscribe(cart => {
          expect(cart?.code).toBe('anon-cart-456');
          done();
        });
      });
    });

    it('should update immediately when cart subject changes after mutation', (done) => {
      sessionSubject.next(mockSession);
      (authService as any).currentSession = mockSession;
      cartIdStorage.read.and.returnValue('cart-001');

      const updatedCart: JuliCart = { ...mockCart, entries: [mockCart.entries![0]] };
      // Constructor já consome o 1º returnValue; reload() explícito usa o 2º; removeEntry→reload usa o 3º
      cartConnector.load.and.returnValues(of(mockCart), of(mockCart), of(updatedCart));
      cartConnector.removeEntry.and.returnValue(of(undefined));

      const facade = buildFacade();

      // Initial load
      facade.reload().subscribe(() => {
        // Remove entry — triggers reload internally
        facade.removeEntry('SKU-B').subscribe(() => {
          facade.cart$.pipe(take(1)).subscribe(cart => {
            expect(cart?.entries?.length).toBe(1);
            done();
          });
        });
      });
    });
  });

  // ─────────────────────────────────────────────
  // itemCount$
  // ─────────────────────────────────────────────

  describe('itemCount$', () => {
    it('should emit 0 when there is no cart', (done) => {
      const facade = buildFacade();
      facade.itemCount$.pipe(take(1)).subscribe(count => {
        expect(count).toBe(0);
        done();
      });
    });

    it('should sum quantities across all cart entries', (done) => {
      sessionSubject.next(mockSession);
      (authService as any).currentSession = mockSession;
      cartIdStorage.read.and.returnValue('cart-001');
      cartConnector.load.and.returnValue(of(mockCart)); // entries: qty 2 + qty 1 = 3

      const facade = buildFacade();

      facade.reload().subscribe(() => {
        facade.itemCount$.pipe(take(1)).subscribe(count => {
          expect(count).toBe(3);
          done();
        });
      });
    });

    it('should emit 0 for a cart with no entries', (done) => {
      sessionSubject.next(mockSession);
      (authService as any).currentSession = mockSession;
      cartIdStorage.read.and.returnValue('cart-001');
      cartConnector.load.and.returnValue(of({ ...mockCart, entries: [] }));

      const facade = buildFacade();

      facade.reload().subscribe(() => {
        facade.itemCount$.pipe(take(1)).subscribe(count => {
          expect(count).toBe(0);
          done();
        });
      });
    });
  });

  // ─────────────────────────────────────────────
  // reload()
  // ─────────────────────────────────────────────

  describe('reload()', () => {
    it('should return EMPTY when unauthenticated and no anonymous cart', (done) => {
      const facade = buildFacade();
      let emitted = false;
      facade.reload().subscribe({
        next: () => { emitted = true; },
        complete: () => {
          expect(emitted).toBeFalse();
          done();
        }
      });
    });

    it('should call connector.load with cartId for authenticated user', (done) => {
      sessionSubject.next(mockSession);
      (authService as any).currentSession = mockSession;
      cartIdStorage.read.and.returnValue('cart-001');
      cartConnector.load.and.returnValue(of(mockCart));

      const facade = buildFacade();

      facade.reload().subscribe(() => {
        expect(cartConnector.load).toHaveBeenCalledWith('cart-001');
        done();
      });
    });

    it('should call connector.loadAnonymous with cartId and token for anonymous user', (done) => {
      anonymousCartStorage.read.and.returnValue(storedAnonymousCart);
      anonymousCartStorage.getAnonymousToken.and.returnValue(mockAnonymousToken);
      anonymousPrincipalSubject.next(mockAnonymousPrincipal);
      cartConnector.loadAnonymous.and.returnValue(of({ ...mockCart, code: 'anon-cart-456' }));

      const facade = buildFacade();

      facade.reload().subscribe(() => {
        expect(cartConnector.loadAnonymous).toHaveBeenCalledWith('anon-cart-456', mockAnonymousToken);
        done();
      });
    });
  });

  // ─────────────────────────────────────────────
  // updateEntry()
  // ─────────────────────────────────────────────

  describe('updateEntry()', () => {
    it('should return EMPTY when no session and no anonymous cart', (done) => {
      const facade = buildFacade();
      let emitted = false;
      facade.updateEntry('SKU-A', 5).subscribe({
        next: () => { emitted = true; },
        complete: () => {
          expect(emitted).toBeFalse();
          done();
        }
      });
    });

    it('should call connector.updateEntry and reload for authenticated user', (done) => {
      sessionSubject.next(mockSession);
      (authService as any).currentSession = mockSession;
      cartIdStorage.read.and.returnValue('cart-001');
      cartConnector.load.and.returnValue(of(mockCart));
      cartConnector.updateEntry.and.returnValue(of({ statusCode: 'success', quantity: 5 }));

      const facade = buildFacade();

      facade.updateEntry('SKU-A', 5).subscribe(() => {
        expect(cartConnector.updateEntry).toHaveBeenCalledWith('cart-001', 'SKU-A', 5);
        expect(cartConnector.load).toHaveBeenCalled();
        done();
      });
    });

    it('should call connector.updateEntryAnonymous and reload for anonymous user', (done) => {
      anonymousCartStorage.read.and.returnValue(storedAnonymousCart);
      anonymousCartStorage.getAnonymousToken.and.returnValue(mockAnonymousToken);
      anonymousPrincipalSubject.next(mockAnonymousPrincipal);
      cartConnector.loadAnonymous.and.returnValue(of({ ...mockCart, code: 'anon-cart-456' }));
      cartConnector.updateEntryAnonymous.and.returnValue(of({ statusCode: 'success', quantity: 3 }));

      const facade = buildFacade();

      facade.updateEntry('SKU-A', 3).subscribe(() => {
        expect(cartConnector.updateEntryAnonymous)
          .toHaveBeenCalledWith('anon-cart-456', 'SKU-A', 3, mockAnonymousToken);
        expect(cartConnector.loadAnonymous).toHaveBeenCalled();
        done();
      });
    });
  });

  // ─────────────────────────────────────────────
  // removeEntry()
  // ─────────────────────────────────────────────

  describe('removeEntry()', () => {
    it('should return EMPTY when no session and no anonymous cart', (done) => {
      const facade = buildFacade();
      let emitted = false;
      facade.removeEntry('SKU-A').subscribe({
        next: () => { emitted = true; },
        complete: () => {
          expect(emitted).toBeFalse();
          done();
        }
      });
    });

    it('should call connector.removeEntry and reload for authenticated user', (done) => {
      sessionSubject.next(mockSession);
      (authService as any).currentSession = mockSession;
      cartIdStorage.read.and.returnValue('cart-001');
      cartConnector.removeEntry.and.returnValue(of(undefined));
      cartConnector.load.and.returnValue(of({ ...mockCart, entries: [mockCart.entries![1]] }));

      const facade = buildFacade();

      facade.removeEntry('SKU-A').subscribe(() => {
        expect(cartConnector.removeEntry).toHaveBeenCalledWith('cart-001', 'SKU-A');
        expect(cartConnector.load).toHaveBeenCalled();
        done();
      });
    });

    it('should call connector.removeEntryAnonymous and reload for anonymous user', (done) => {
      anonymousCartStorage.read.and.returnValue(storedAnonymousCart);
      anonymousCartStorage.getAnonymousToken.and.returnValue(mockAnonymousToken);
      anonymousPrincipalSubject.next(mockAnonymousPrincipal);
      cartConnector.removeEntryAnonymous.and.returnValue(of(undefined));
      cartConnector.loadAnonymous.and.returnValue(of({ ...mockCart, entries: [], code: 'anon-cart-456' }));

      const facade = buildFacade();

      facade.removeEntry('SKU-A').subscribe(() => {
        expect(cartConnector.removeEntryAnonymous)
          .toHaveBeenCalledWith('anon-cart-456', 'SKU-A', mockAnonymousToken);
        expect(cartConnector.loadAnonymous).toHaveBeenCalled();
        done();
      });
    });
  });

  // ─────────────────────────────────────────────
  // clear()
  // ─────────────────────────────────────────────

  describe('clear()', () => {
    it('should call connector.delete and clear cart ID storage for authenticated user', () => {
      sessionSubject.next(mockSession);
      (authService as any).currentSession = mockSession;
      cartIdStorage.read.and.returnValue('cart-001');
      cartConnector.load.and.returnValue(of(mockCart));
      cartConnector.delete.and.returnValue(of(undefined));

      const facade = buildFacade();

      facade.clear();

      expect(cartConnector.delete).toHaveBeenCalledWith('cart-001');
      expect(cartIdStorage.clear).toHaveBeenCalledWith(mockSession.username);
    });

    it('should clear anonymous storage when anonymous cart exists', () => {
      anonymousCartStorage.read.and.returnValue(storedAnonymousCart);
      anonymousCartStorage.getAnonymousToken.and.returnValue(mockAnonymousToken);
      cartConnector.deleteAnonymous.and.returnValue(of(undefined));

      const facade = buildFacade();

      facade.clear();

      expect(anonymousCartStorage.clear).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // isAnonymousCart() / currentCartId
  // ─────────────────────────────────────────────

  describe('isAnonymousCart()', () => {
    it('should return false when authenticated', () => {
      (authService as any).isAuthenticated = true;
      const facade = buildFacade();
      expect(facade.isAnonymousCart()).toBeFalse();
    });

    it('should return false when unauthenticated and no cart', () => {
      (authService as any).isAuthenticated = false;
      const facade = buildFacade();
      expect(facade.isAnonymousCart()).toBeFalse();
    });

    it('should return true when unauthenticated and anonymous cart exists', () => {
      (authService as any).isAuthenticated = false;
      anonymousCartStorage.read.and.returnValue(storedAnonymousCart);
      const facade = buildFacade();
      expect(facade.isAnonymousCart()).toBeTrue();
    });
  });

  describe('currentCartId', () => {
    it('should return null when unauthenticated and no anonymous cart', () => {
      const facade = buildFacade();
      expect(facade.currentCartId).toBeNull();
    });

    it('should return anonymous cart ID when anonymous', () => {
      anonymousCartStorage.read.and.returnValue(storedAnonymousCart);
      (authService as any).isAuthenticated = false;
      const facade = buildFacade();
      expect(facade.currentCartId).toBe('anon-cart-456');
    });
  });
});

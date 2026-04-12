import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Pipe, PipeTransform } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';

import { CartPageComponent } from '../cart-page.component';
import { JuliCartFacade, JuliCart } from '../../../core/commerce/facades/cart.facade';
import { UbrisProductAdapter } from '../../../core/commerce/adapters/product.adapter';

// ── Stub pipe para juliTranslate ────────────────────────────────────────────
@Pipe({ name: 'juliTranslate' })
class JuliTranslatePipeStub implements PipeTransform {
  transform(key: string): string { return key; }
}

// ── Dados de fixture ────────────────────────────────────────────────────────
const makeCart = (overrides: Partial<JuliCart> = {}): JuliCart => ({
  code: 'cart-001',
  entries: [
    {
      entryNumber: 0, quantity: 2,
      product: { code: 'SKU-A', name: 'Produto Alpha' },
      basePrice: { value: 50, formattedValue: 'R$ 50,00' },
      totalPrice: { value: 100, formattedValue: 'R$ 100,00' }
    },
    {
      entryNumber: 1, quantity: 1,
      product: { code: 'SKU-B', name: 'Produto Beta' },
      basePrice: { value: 75, formattedValue: 'R$ 75,00' },
      totalPrice: { value: 75, formattedValue: 'R$ 75,00' }
    }
  ],
  subTotal: { value: 175, formattedValue: 'R$ 175,00' },
  totalPrice: { value: 175, formattedValue: 'R$ 175,00' },
  ...overrides
});

// ── Suite ───────────────────────────────────────────────────────────────────
describe('CartPageComponent', () => {
  let fixture: ComponentFixture<CartPageComponent>;
  let component: CartPageComponent;

  let cartSubject: BehaviorSubject<JuliCart | null>;
  let itemCountSubject: BehaviorSubject<number>;
  let cartFacade: jasmine.SpyObj<JuliCartFacade>;
  let productAdapter: jasmine.SpyObj<UbrisProductAdapter>;

  beforeEach(async () => {
    cartSubject = new BehaviorSubject<JuliCart | null>(null);
    itemCountSubject = new BehaviorSubject<number>(0);

    cartFacade = jasmine.createSpyObj('JuliCartFacade', ['reload', 'updateEntry', 'removeEntry'], {
      cart$: cartSubject.asObservable(),
      itemCount$: itemCountSubject.asObservable(),
      loading$: of(false)
    });
    cartFacade.reload.and.returnValue(of(null as any));
    cartFacade.updateEntry.and.returnValue(of(null as any));
    cartFacade.removeEntry.and.returnValue(of(null as any));

    productAdapter = jasmine.createSpyObj('UbrisProductAdapter', ['get']);
    productAdapter.get.and.returnValue(of({ data: { images: [{ url: 'http://img/sku.jpg' }] } } as any));

    await TestBed.configureTestingModule({
      declarations: [CartPageComponent, JuliTranslatePipeStub],
      imports: [RouterTestingModule],
      providers: [
        { provide: JuliCartFacade, useValue: cartFacade },
        { provide: UbrisProductAdapter, useValue: productAdapter }
      ]
    })
    // Override OnPush para forçar detecção síncrona nos testes
    .overrideComponent(CartPageComponent, {
      set: { changeDetection: ChangeDetectionStrategy.Default }
    })
    .compileComponents();

    fixture = TestBed.createComponent(CartPageComponent);
    component = fixture.componentInstance;
  });

  // ── Estado inicial ────────────────────────────────────────────────────────
  describe('estado inicial', () => {
    it('deve criar o componente', () => {
      expect(component).toBeTruthy();
    });

    it('deve começar com reloading=true e updating=false', () => {
      // Precisa de um reload pendente para que reloading permaneça true
      const pendingReload = new Subject<any>();
      cartFacade.reload.and.returnValue(pendingReload.asObservable());
      const freshFixture = TestBed.createComponent(CartPageComponent);
      const freshComponent = freshFixture.componentInstance;
      expect(freshComponent.reloading).toBeTrue();
      expect(freshComponent.updating).toBeFalse();
      pendingReload.complete(); // evita subscription leak
    });

    it('deve chamar cartFacade.reload() na construção', () => {
      expect(cartFacade.reload).toHaveBeenCalledTimes(1);
    });

    it('deve definir reloading=false após reload completar', fakeAsync(() => {
      cartFacade.reload.and.returnValue(of(null as any));
      fixture = TestBed.createComponent(CartPageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();
      expect(component.reloading).toBeFalse();
    }));

    it('deve definir reloading=false mesmo se reload retornar erro', fakeAsync(() => {
      cartFacade.reload.and.returnValue(throwError(() => new Error('fail')));
      fixture = TestBed.createComponent(CartPageComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();
      expect(component.reloading).toBeFalse();
    }));
  });

  // ── Renderização do spinner de carregamento ───────────────────────────────
  describe('estado de carregamento (reloading=true)', () => {
    it('deve exibir spinner enquanto reloading=true', () => {
      component.reloading = true;
      fixture.detectChanges();
      const spinner = fixture.nativeElement.querySelector('.ub-loading-spinner');
      expect(spinner).toBeTruthy();
    });

    it('não deve exibir itens do carrinho enquanto reloading=true', () => {
      component.reloading = true;
      cartSubject.next(makeCart());
      fixture.detectChanges();
      const cartItems = fixture.nativeElement.querySelector('.cart-items');
      expect(cartItems).toBeNull();
    });
  });

  // ── Estado vazio ─────────────────────────────────────────────────────────
  describe('estado vazio', () => {
    beforeEach(() => {
      component.reloading = false;
    });

    it('deve exibir empty state quando cart$ emite null', () => {
      cartSubject.next(null);
      fixture.detectChanges();
      const emptyTitle = fixture.nativeElement.querySelector('.ub-empty__title');
      expect(emptyTitle).toBeTruthy();
    });

    it('deve exibir empty state quando cart.entries está vazio', () => {
      cartSubject.next(makeCart({ entries: [] }));
      fixture.detectChanges();
      const emptyTitle = fixture.nativeElement.querySelector('.ub-empty__title');
      expect(emptyTitle).toBeTruthy();
    });
  });

  // ── Renderização do carrinho ──────────────────────────────────────────────
  describe('renderização do carrinho com entradas', () => {
    beforeEach(() => {
      component.reloading = false;
      cartSubject.next(makeCart());
      itemCountSubject.next(3);
      fixture.detectChanges();
    });

    it('deve renderizar um article por entrada', () => {
      const articles = fixture.nativeElement.querySelectorAll('.cart-item');
      expect(articles.length).toBe(2);
    });

    it('deve exibir o nome do produto', () => {
      const names = fixture.nativeElement.querySelectorAll('.cart-item__name');
      expect(names[0].textContent).toContain('Produto Alpha');
      expect(names[1].textContent).toContain('Produto Beta');
    });

    it('deve exibir o SKU do produto', () => {
      const skus = fixture.nativeElement.querySelectorAll('.cart-item__sku');
      expect(skus[0].textContent).toContain('SKU-A');
    });

    it('deve exibir a quantidade de cada entrada', () => {
      const qtys = fixture.nativeElement.querySelectorAll('.cart-qty-value');
      expect(qtys[0].textContent.trim()).toBe('2');
      expect(qtys[1].textContent.trim()).toBe('1');
    });

    it('deve exibir o preço total de cada entrada', () => {
      const prices = fixture.nativeElement.querySelectorAll('.cart-item__price strong');
      expect(prices[0].textContent).toContain('R$ 100,00');
      expect(prices[1].textContent).toContain('R$ 75,00');
    });

    it('deve exibir o subtotal no resumo', () => {
      const rows = fixture.nativeElement.querySelectorAll('.ub-order-total-row');
      expect(rows[0].textContent).toContain('R$ 175,00');
    });
  });

  // ── Imagens de produto ─────────────────────────────────────────────────────
  describe('carregamento de imagens', () => {
    it('deve chamar productAdapter.get para cada entry com código', fakeAsync(() => {
      component.reloading = false;
      cartSubject.next(makeCart());
      fixture.detectChanges();
      tick();
      // 2 entradas com códigos distintos
      expect(productAdapter.get).toHaveBeenCalledWith('SKU-A');
      expect(productAdapter.get).toHaveBeenCalledWith('SKU-B');
    }));

    it('deve preencher productImages quando a resposta contém imagens', fakeAsync(() => {
      component.reloading = false;
      cartSubject.next(makeCart());
      fixture.detectChanges();
      tick();
      expect(component.productImages['SKU-A']).toBe('http://img/sku.jpg');
    }));

    it('não deve chamar productAdapter.get duas vezes para o mesmo código', fakeAsync(() => {
      component.reloading = false;
      const cart = makeCart();
      cartSubject.next(cart);
      fixture.detectChanges();
      tick();
      // Emitir novamente o mesmo carrinho
      cartSubject.next({ ...cart });
      fixture.detectChanges();
      tick();
      // Deve ter chamado apenas 1x por código
      const calls = productAdapter.get.calls.allArgs();
      const skuACalls = calls.filter(args => args[0] === 'SKU-A');
      expect(skuACalls.length).toBe(1);
    }));

    it('deve tolerar erro no productAdapter.get sem travar', fakeAsync(() => {
      productAdapter.get.and.returnValue(throwError(() => new Error('img fail')));
      component.reloading = false;
      expect(() => {
        cartSubject.next(makeCart());
        fixture.detectChanges();
        tick();
      }).not.toThrow();
    }));

    it('getProductImage deve retornar URL da cache', fakeAsync(() => {
      component.reloading = false;
      cartSubject.next(makeCart());
      fixture.detectChanges();
      tick();
      const entry = makeCart().entries![0];
      expect(component.getProductImage(entry)).toBe('http://img/sku.jpg');
    }));

    it('getProductImage deve retornar null se código não está em cache', () => {
      const entry = { product: { code: 'UNKNOWN' }, quantity: 1 } as any;
      expect(component.getProductImage(entry)).toBeNull();
    });

    it('getProductImage deve retornar null para entry sem código', () => {
      expect(component.getProductImage({ product: {} } as any)).toBeNull();
      expect(component.getProductImage(null as any)).toBeNull();
    });
  });

  // ── incrementQuantity ─────────────────────────────────────────────────────
  describe('incrementQuantity()', () => {
    const entry = () => makeCart().entries![0]; // qty=2, SKU-A

    it('deve chamar updateEntry com SKU e qty+1', () => {
      component.incrementQuantity(entry());
      expect(cartFacade.updateEntry).toHaveBeenCalledWith('SKU-A', 3);
    });

    it('deve definir updating=true durante a chamada e false após', () => {
      component.incrementQuantity(entry());
      expect(component.updating).toBeFalse(); // of() completa sincrônico
    });

    it('não deve chamar updateEntry se updating=true', () => {
      component.updating = true;
      component.incrementQuantity(entry());
      expect(cartFacade.updateEntry).not.toHaveBeenCalled();
    });

    it('deve resetar updating=false mesmo em caso de erro', () => {
      cartFacade.updateEntry.and.returnValue(throwError(() => new Error('err')));
      component.incrementQuantity(entry());
      expect(component.updating).toBeFalse();
    });
  });

  // ── decrementQuantity ─────────────────────────────────────────────────────
  describe('decrementQuantity()', () => {
    it('deve chamar updateEntry com qty-1 quando qty > 1', () => {
      const entry = makeCart().entries![0]; // qty=2
      component.decrementQuantity(entry);
      expect(cartFacade.updateEntry).toHaveBeenCalledWith('SKU-A', 1);
      expect(cartFacade.removeEntry).not.toHaveBeenCalled();
    });

    it('deve chamar removeEntry quando qty já é 1', () => {
      const entry = makeCart().entries![1]; // qty=1
      component.decrementQuantity(entry);
      expect(cartFacade.removeEntry).toHaveBeenCalledWith('SKU-B');
      expect(cartFacade.updateEntry).not.toHaveBeenCalled();
    });

    it('deve chamar removeEntry quando qty=0 (estado inválido, não deve travar)', () => {
      const entry = { product: { code: 'SKU-X' }, quantity: 0 } as any;
      component.decrementQuantity(entry);
      expect(cartFacade.removeEntry).toHaveBeenCalledWith('SKU-X');
    });

    it('não deve chamar nada se updating=true', () => {
      component.updating = true;
      component.decrementQuantity(makeCart().entries![0]);
      expect(cartFacade.updateEntry).not.toHaveBeenCalled();
      expect(cartFacade.removeEntry).not.toHaveBeenCalled();
    });

    it('deve resetar updating=false mesmo em caso de erro em updateEntry', () => {
      cartFacade.updateEntry.and.returnValue(throwError(() => new Error('err')));
      component.decrementQuantity(makeCart().entries![0]);
      expect(component.updating).toBeFalse();
    });

    it('deve resetar updating=false mesmo em caso de erro em removeEntry', () => {
      cartFacade.removeEntry.and.returnValue(throwError(() => new Error('err')));
      component.decrementQuantity(makeCart().entries![1]);
      expect(component.updating).toBeFalse();
    });
  });

  // ── removeItem ────────────────────────────────────────────────────────────
  describe('removeItem()', () => {
    it('deve chamar removeEntry com o SKU correto', () => {
      const entry = makeCart().entries![0];
      component.removeItem(entry);
      expect(cartFacade.removeEntry).toHaveBeenCalledWith('SKU-A');
    });

    it('não deve chamar removeEntry se updating=true', () => {
      component.updating = true;
      component.removeItem(makeCart().entries![0]);
      expect(cartFacade.removeEntry).not.toHaveBeenCalled();
    });

    it('deve resetar updating=false mesmo em caso de erro', () => {
      cartFacade.removeEntry.and.returnValue(throwError(() => new Error('err')));
      component.removeItem(makeCart().entries![0]);
      expect(component.updating).toBeFalse();
    });
  });

  // ── Botões disabled enquanto updating ────────────────────────────────────
  describe('botões desabilitados durante atualização', () => {
    beforeEach(() => {
      component.reloading = false;
      cartSubject.next(makeCart());
      itemCountSubject.next(3);
    });

    it('deve desabilitar botões de qty e remover quando updating=true', () => {
      component.updating = true;
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button[disabled]');
      // 2 entradas × 3 botões (-, +, remover) = 6
      expect(buttons.length).toBe(6);
    });

    it('deve habilitar botões quando updating=false', () => {
      component.updating = false;
      fixture.detectChanges();
      const buttons = fixture.nativeElement.querySelectorAll('button[disabled]');
      expect(buttons.length).toBe(0);
    });
  });
});

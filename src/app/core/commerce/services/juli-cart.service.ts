import { Injectable } from '@angular/core';
import { JuliCartFacade } from '../facades/cart.facade';

@Injectable({ providedIn: 'root' })
export class JuliCartService {
  constructor(private readonly cartFacade: JuliCartFacade) {}

  /**
   * Adiciona um produto ao carrinho com customizações de forma transparente para a UI.
   * O contrato explícito (SKU, Qty, Customizations) é preservado.
   */
  addWithCustomizations(
    productCode: string,
    quantity: number = 1,
    _customizations?: Record<string, any>,
    _forceNewEntry: boolean = false
  ): void {
    this.cartFacade.addEntry(productCode, quantity).subscribe({ error: () => undefined });
  }

  /**
   * Remove uma entrada baseando-se estritamente no entryNumber.
   * Não requer conhecimento do productCode original.
   */
  removeEntry(entryNumber: number): void {
    this.cartFacade.removeEntry(entryNumber).subscribe({ error: () => undefined });
  }

  /**
   * Atualiza a quantidade de uma entrada existente via entryNumber.
   */
  updateEntry(entryNumber: number, quantity: number): void {
    this.cartFacade.updateEntry(entryNumber, quantity).subscribe({ error: () => undefined });
  }
}

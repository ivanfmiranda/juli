import { Injectable } from '@angular/core';
import { ActiveCartService, MultiCartService } from '@spartacus/core';

@Injectable({ providedIn: 'root' })
export class JuliCartService {
  constructor(
    private readonly activeCartService: ActiveCartService,
    private readonly multiCartService: MultiCartService
  ) {}

  /**
   * Adiciona um produto ao carrinho com customizações de forma transparente para a UI.
   * O contrato explícito (SKU, Qty, Customizations) é preservado.
   */
  addWithCustomizations(
    productCode: string,
    quantity: number = 1,
    customizations?: Record<string, any>,
    forceNewEntry: boolean = false
  ): void {
    const identity = JSON.stringify({
      productCode,
      customizations,
      forceNewEntry
    });

    this.activeCartService.addEntry(identity, quantity);
  }

  /**
   * Remove uma entrada baseando-se estritamente no entryNumber.
   * Não requer conhecimento do productCode original.
   */
  removeEntry(entryNumber: number): void {
    this.activeCartService.removeEntry({ entryNumber });
  }

  /**
   * Atualiza a quantidade de uma entrada existente via entryNumber.
   */
  updateEntry(entryNumber: number, quantity: number): void {
    this.activeCartService.updateEntry(entryNumber, quantity);
  }
}

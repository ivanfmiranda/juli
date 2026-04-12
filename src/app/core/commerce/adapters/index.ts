/**
 * Commerce Adapters Index
 *
 * Exporta todos os adapters disponíveis para o JULI.
 *
 * Estrutura:
 * - ubris/    : Adapters ativos para backend Ubris
 * - hybris/   : Adapters para SAP Commerce Cloud (futuro)
 */

// Ubris Adapters (Ativo)
export * from './ubris';

// Hybris Adapters (Futuro)
export * from './hybris';

// Legacy Adapters (manter compatibilidade temporária)
export { UbrisOrderAdapter } from './ubris/ubris-order.adapter';

/**
 * Commerce Adapters Index
 *
 * Exporta todos os adapters disponíveis para o JULI.
 *
 * Estrutura:
 * - ubris/    : Adapters ativos para backend Ubris
 */

// Ubris Adapters (Ativo)
export * from './ubris';

// Legacy Adapters (manter compatibilidade temporária)
export { UbrisOrderAdapter } from './ubris/ubris-order.adapter';

/**
 * Commerce Adapters Index
 * 
 * Exporta todos os adapters disponíveis para o JULI.
 * 
 * Estrutura:
 * - ubris/    : Adapters ativos para backend Ubris
 * - hybris/   : Adapters para SAP Commerce Cloud (futuro)
 * - placeholders/ : Adapters temporários para capabilities não implementadas
 */

// Ubris Adapters (Ativo)
export * from './ubris';

// Hybris Adapters (Futuro)
export * from './hybris';

// Placeholders (Capabilities futuras)
export * from './placeholders';

// Legacy Adapters (manter compatibilidade temporária)
export { UbrisOrderAdapter } from './ubris/ubris-order.adapter';

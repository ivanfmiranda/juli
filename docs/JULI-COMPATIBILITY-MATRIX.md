# JULI Compatibility Matrix

## Visão Geral

O **JULI** é um storefront Angular (Spartacus-based) projetado para ser **multi-backend**, suportando tanto Ubris quanto SAP Commerce Cloud (Hybris).

## Arquitetura de Compatibilidade

```
juli/src/app/core/commerce/
├── adapters/
│   ├── ubris/          # Adapters específicos Ubris (ativo)
│   ├── hybris/         # Adapters específicos Hybris (placeholder)
│   └── placeholders/   # Adapters temporários/capabilities futuras
├── models/             # Modelos canônicos (backend-agnostic)
├── facades/            # Facades (backend-agnostic)
└── connectors/         # Connectors (backend-agnostic)
```

## Matriz de Compatibilidade

### Core Commerce Features

| Feature | Ubris Status | Hybris Status | Tipo | Notas |
|---------|-------------|---------------|------|-------|
| **Product Catalog** | ✅ Real | ⚠️ Placeholder | Bridge | Spartacus ProductAdapter |
| **Product Search** | ✅ Real | ⚠️ Placeholder | Bridge | Spartacus SearchAdapter |
| **Categories** | ✅ Real | ⚠️ Placeholder | Bridge | Spartacus CategoryAdapter |
| **Cart** | ✅ Real | ⚠️ Placeholder | Bridge | Spartacus CartAdapter |
| **Cart Entries** | ✅ Real | ⚠️ Placeholder | Bridge | Spartacus CartEntryAdapter |
| **Checkout** | ✅ Custom | ❌ N/A | Custom | JULI Checkout Facade (Stripe/Pix) |
| **Orders - List** | ✅ Real | ⚠️ Placeholder | Bridge | UbrisOrderAdapter |
| **Orders - Detail** | ✅ Real | ⚠️ Placeholder | Bridge | UbrisOrderAdapter |
| **Order History** | ✅ Real | ⚠️ Placeholder | Bridge | Spartacus UserOrderAdapter |

### User Management Features

| Feature | Ubris Status | Hybris Status | Tipo | Notas |
|---------|-------------|---------------|------|-------|
| **Authentication** | ✅ Real | ⚠️ Placeholder | Bridge | OAuth2/Custom |
| **User Profile** | ✅ Real | ⚠️ Placeholder | Bridge | Spartacus UserAdapter |
| **Saved Addresses** | ❌ N/A | ⚠️ Placeholder | Placeholder | Checkout usa formulário inline |
| **Saved Payments** | ❌ N/A | ⚠️ Placeholder | Placeholder | Stripe/Pix - sem saved cards |
| **User Consents** | ❌ N/A | ⚠️ Placeholder | Placeholder | GDPR/Consent management |

### B2B Features

| Feature | Ubris Status | Hybris Status | Tipo | Notas |
|---------|-------------|---------------|------|-------|
| **Cost Centers** | ❌ N/A | ⚠️ Placeholder | Placeholder | B2B feature |
| **Budgets** | ❌ N/A | ⚠️ Placeholder | Placeholder | B2B feature |
| **User Groups** | ❌ N/A | ⚠️ Placeholder | Placeholder | B2B feature |

### Advanced Features

| Feature | Ubris Status | Hybris Status | Tipo | Notas |
|---------|-------------|---------------|------|-------|
| **Promotions** | ✅ Real | ⚠️ Placeholder | Bridge | Cart promotions |
| **Coupons** | ⚠️ Placeholder | ⚠️ Placeholder | Placeholder | Customer coupons |
| **Product Interests** | ⚠️ Placeholder | ⚠️ Placeholder | Placeholder | Back-in-stock |
| **Notification Preferences** | ⚠️ Placeholder | ⚠️ Placeholder | Placeholder | Email/SMS prefs |
| **Consignment Tracking** | ❌ Não suportado | ⚠️ Placeholder | Placeholder | Shipping tracking |
| **Returns** | ❌ Não suportado | ⚠️ Placeholder | Placeholder | Return requests |
| **Replenishment** | ❌ N/A | ⚠️ Placeholder | Placeholder | Subscription orders |

## Legenda

| Ícone | Significado |
|-------|-------------|
| ✅ Real | Implementação completa e funcional |
| ⚠️ Placeholder | Adapter stub - dependência injetável mas não funcional |
| ❌ N/A | Não aplicável/não suportado pelo backend |
| 🔧 Bridge | Adaptador entre Spartacus e backend específico |
| 🎯 Custom | Implementação própria do JULI (não Spartacus) |

## Estratégia Multi-Backend

### Ubris (Atual)
- Uso: Produção
- Backend: Microservices Java/Spring Boot
- APIs: Gateway BFF custom
- Autenticação: OAuth2 custom

### Hybris (Futuro)
- Uso: Integração planejada
- Backend: SAP Commerce Cloud
- APIs: Omni Commerce Connect (OCC)
- Autenticação: OAuth2/OIDC standard

### Migração Hybris
Para ativar suporte Hybris:

1. **Implementar Adapters Hybris**:
   ```typescript
   // adapters/hybris/hybris-order.adapter.ts
   export class HybrisOrderAdapter implements UserOrderAdapter {
     // Implementar métodos OCC
   }
   ```

2. **Configurar Endpoints OCC**:
   ```typescript
   // ConfigModule
   backend: {
     occ: {
       baseUrl: 'https://hybris-server',
       prefix: '/occ/v2/'
     }
   }
   ```

3. **Substituir Provider**:
   ```typescript
   // commerce.module.ts
   { provide: UserOrderAdapter, useClass: HybrisOrderAdapter }
   ```

## Módulos de Compatibilidade

### UserTransitional_4_2_Module

**Status:** Mantido por enquanto

**Razão:** O módulo fornece:
- `UserOrderService` (necessário para orders)
- `UserIdService` (necessário para auth)
- State management de user (orders)

**Alternativa futura:**
- Criar `UserOrderMinimalModule` custom quando houver necessidade de remover dependências não usadas
- Manter apenas: UserOrderService, UserIdService, e state de orders

## Roadmap

### Q1 2024
- [ ] Documentar todos os adapters Ubris
- [ ] Criar testes de integração para adapters Ubris
- [ ] Matriz de compatibilidade 100% documentada

### Q2 2024
- [ ] Implementar HybrisOrderAdapter (estrutura base)
- [ ] Configurar ambiente de teste Hybris
- [ ] POC: JULI + Hybris

### Q3 2024
- [ ] Hybris Product Catalog adapter
- [ ] Hybris Cart adapter
- [ ] Hybris Checkout adapter (se diferente)

### Q4 2024
- [ ] Feature parity Ubris vs Hybris
- [ ] Documentação de migração
- [ ] Suporte produção Hybris

## Workarounds de Compatibilidade

### Import de Módulos Internos do Spartacus

O `UserNotificationPreferenceAdapter` não é exportado no index principal do `@spartacus/core`. 

**Solução:** Import do path interno ESM + declarações de tipo locais.

**Documentação:** Ver `COMPAT-LAYER-WORKAROUNDS.md`

**Risco:** Path interno pode mudar em upgrades do Spartacus.

## Contato

Para dúvidas sobre compatibilidade:
- Arquitetura: [Time de Arquitetura]
- Ubris: [Time Ubris]
- Hybris: [Time Hybris]

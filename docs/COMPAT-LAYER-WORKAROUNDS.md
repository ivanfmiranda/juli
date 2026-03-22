# Spartacus Compatibility Layer Workarounds

Este documento descreve as soluções alternativas (workarounds) implementadas para resolver incompatibilidades entre o JULI e o Spartacus 4.2.

---

## UserNotificationPreferenceConnector DI Error (RESOLVIDO)

**Status:** ✅ RESOLVIDO via MinimalUserModule

### Problema

O `UserTransitional_4_2_Module` do Spartacus registra `NotificationPreferenceEffects`, que injeta `UserNotificationPreferenceConnector`. Esta classe **não é exportada** do `@spartacus/core` público, causando:

```
NullInjectorError: No provider for UserNotificationPreferenceConnector
```

### Tentativas Anteriores (Não Funcionaram)

1. **Stub do Connector**: Importar de `@spartacus/core/esm2015/...` causava token mismatch
2. **Custom Effects Array**: Requer imports internos que falham com Angular compiler
3. **Provider Override**: Não funciona porque o token não é exportado

### Solução Implementada (✅)

**MinimalUserModule** - Usa APENAS a API pública do Spartacus:

```typescript
// minimal-user.module.ts
import { 
  StateModule,
  USER_FEATURE,
  UserAddressService,
  UserConsentService,
  UserOrderService,
  UserPaymentService
} from '@spartacus/core';

@NgModule({})
export class MinimalUserModule {
  static forRootMinimal(): ModuleWithProviders<MinimalUserModule> {
    return {
      ngModule: MinimalUserModule,
      providers: [
        UserAddressService,
        UserConsentService, 
        UserOrderService,
        UserPaymentService,
      ]
    };
  }
}
```

**Uso em app.module.ts:**

```typescript
import { MinimalUserModule } from './core/user';

@NgModule({
  imports: [
    // UserTransitional_4_2_Module.forRoot(), // REMOVIDO
    MinimalUserModule.forRootMinimal(), // NOVO
  ]
})
export class AppModule {}
```

### Funcionalidades Suportadas

| Feature | Status | Adapter |
|---------|--------|---------|
| User Addresses | ✅ | OccUserAddressAdapter |
| User Consents | ✅ | OccUserConsentAdapter |
| User Orders | ✅ | UbrisOrderAdapter (custom) |
| Payment Methods | ✅ | OccUserPaymentAdapter |
| Regions/Countries | ✅ | Built-in |

### Funcionalidades NÃO Suportadas (por design)

| Feature | Razão |
|---------|-------|
| Notification Preferences | Connector não exportado |
| Customer Coupons | Não implementado |
| Product Interests | Não implementado |
| Cost Centers | B2B - fora de escopo |

### Arquivos Criados/Modificados

```
juli/src/app/core/user/
├── minimal-user.module.ts          # NOVO - Módulo minimalista
├── index.ts                         # MODIFICADO - Exporta MinimalUserModule
├── custom-user-effects.ts           # REMOVIDO (não usado)
├── custom-user-transitional.module.ts # REMOVIDO (não usado)
└── *.d.ts                           # REMOVIDOS (declarações não necessárias)

juli/src/app/app.module.ts           # MODIFICADO - Usa MinimalUserModule
```

### Build & Test

```bash
# Build
npm run build
# ✔ Build successful (7.99 MB)

# Servidor
npm start
# ✔ Server running on http://localhost:4200
```

---

## Histórico de Mudanças

| Data | Mudança |
|------|---------|
| 2026-03-20 | Implementado MinimalUserModule como solução definitiva |
| 2026-03-20 | Removidos arquivos de workaround não utilizados |
| 2026-03-20 | Atualizada documentação |

---

## Notas Técnicas

### Por que não usar UserTransitional_4_2_Module?

O `UserTransitional_4_2_Module` inclui `NotificationPreferenceEffects` via `EffectsModule.forFeature()`:

```javascript
// node_modules/@spartacus/core/esm2015/...
export const effectsTransitional_4_2 = [
  // ... outros effects
  NotificationPreferenceEffects,  // <- Causa DI error
  // ...
];
```

Este effect injeta `UserNotificationPreferenceConnector` que não é exportado:

```typescript
// notification-preference.effect.ts
constructor(
  private actions$: Actions,
  private connector: UserNotificationPreferenceConnector  // <- Não exportado
) {}
```

### Por que MinimalUserModule funciona?

Em vez de usar effects NgRx para gerenciamento de estado, o `MinimalUserModule` usa diretamente os **services** do Spartacus (`UserAddressService`, `UserOrderService`, etc.). Estes services:

1. São exportados da API pública
2. Usam adapters OCC padrão (exportados)
3. Não dependem de `NotificationPreferenceEffects`

Isso é suficiente para o JULI porque:
- O JULI usa checkout custom (não usa UserAddressService diretamente)
- Orders são gerenciadas via `UbrisOrderAdapter`
- Payment é gerenciado pelo JULI payment service

---

## Referências

- [Spartacus 4.2 Docs](https://sap.github.io/spartacus-docs/)
- [Angular DI Guide](https://angular.io/guide/dependency-injection)
- [NgRx Effects](https://ngrx.io/guide/effects)

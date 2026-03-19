# Architecture Checklist

> Checklist manual para validar a integridade da arquitetura Juli CMS.
> Execute antes de cada release ou quando adicionar novos componentes.

---

## 🛡️ Boundary Rules Check

- [ ] **NO_STRAPI_IN_UI**: Nenhum uso de payload cru (`__component`, `attributes`, `data.data`) fora do adapter
  - Verifique: `grep -r '__component' src/app/shared/components/`
  - Esperado: Nenhum resultado
  
- [ ] **RENDERER_STRAPI_AGNOSTIC**: Todos os componentes importam apenas de `core/models/cms.model`
  - Verifique: Componentes não importam estruturas Strapi
  - Esperado: Apenas interfaces canônicas usadas

- [ ] **ACL_STRICT_DTO**: Adapter é o único lugar que conhece DTOs Strapi
  - Verifique: `strapi-cms.adapter.ts` é o único arquivo com lógica de mapeamento
  - Esperado: Isolamento completo

---

## 📋 Model Rules Check

- [ ] **CANONICAL_MANDATORY**: Todos os componentes usam modelo canônico
  - Verifique: Todo componente usa `CmsComponentData<ModeloEspecifico>`
  - Exemplo: `constructor(protected componentData: CmsComponentData<HeroBannerComponentModel>)`

- [ ] **EXPLICIT_COMPONENT_TYPE**: Todos os componentes têm tipo explícito
  - Verifique: `typeCode` definido em todos os mappers
  - Verifique: `flexType` populado para Spartacus

- [ ] **SERIALIZABLE_MODELS**: Modelos são interfaces puras
  - Verifique: Nenhum método em interfaces de `cms.model.ts`
  - Esperado: Apenas propriedades com tipos primitivos ou interfaces

---

## 🗺️ Mapping Rules Check

- [ ] **MAPPER_OR_FALLBACK**: Todo tipo CMS tem mapper ou fallback
  - Verifique: `mapComponent` no adapter cobre todos os tipos ou retorna fallback
  - Verifique: `UnknownComponent` registrado no módulo

- [ ] **CENTRALIZED_REGISTRY**: Registry centralizado em `StrapiCmsModule`
  - Verifique: Todas as entradas `cmsComponents` estão em `strapi-cms.module.ts`
  - Proibido: Configurações espalhadas em outros módulos

- [ ] **SAFE_MAPPING**: Ausência de mapper não quebra app
  - Teste: Acesse `/page/unknown` no mock
  - Esperado: UI mostra `UnknownComponent`, não crasha

---

## 🎨 Rendering Rules Check

- [ ] **CANONICAL_BASED_RENDERING**: Renderização usa modelo canônico
  - Verifique: Templates usam `data$ | async` e propriedades canônicas
  - Proibido: Parse manual de payload nos templates

- [ ] **REGION_BASED_LAYOUT**: Layout baseado em regiões (Slots)
  - Verifique: Páginas definem slots (`Section1`, `Section2`)
  - Verifique: Componentes são atribuídos a slots no adapter

- [ ] **NO_RAW_PAYLOAD_PARSING**: Nenhum parsing de payload bruto
  - Verifique: `hero-banner.component.html` usa `data.title`, não `data.attributes.title`

---

## 🛟 Fallback Rules Check

- [ ] **CONTROLLED_FALLBACK**: Todo erro resulta em fallback
  - Verifique: `FallbackPolicyService` aplicado globalmente
  - Verifique: Tipos desconhecidos → `UnknownComponent`
  - Verifique: Payload inválido → `ErrorComponent`
  - Verifique: Conteúdo vazio → `EmptyState`
  - Verifique: Erro API → `ErrorComponent`
  - Verifique: Página inexistente → `NotFoundPage`

- [ ] **NO_APP_CRASH**: Nenhum erro quebra a aplicação
  - Teste: Acesse `/page/error` no mock
  - Esperado: Mensagem de erro amigável, app continua funcional

- [ ] **GRACEFUL_DEGRADATION**: Degradação gradual
  - Teste: Acesse `/page/partial` no mock
  - Esperado: Componentes válidos renderizam, componentes inválidos mostram fallback

---

## 🔧 Component Registry Check

Verifique se todos os componentes estão registrados:

| Componente | typeCode | Angular Component | Status |
|------------|----------|-------------------|--------|
| HeroBanner | `JuliHeroBannerComponent` | `HeroBannerComponent` | ⬜ |
| SimpleBanner | `JuliSimpleBannerComponent` | `SimpleBannerComponent` | ⬜ |
| RichText | `CMSParagraphComponent` | `RichTextComponent` | ⬜ |
| CtaBlock | `JuliCtaBlockComponent` | `CtaBlockComponent` | ⬜ |
| ProductTeaser | `JuliProductTeaserComponent` | `ProductTeaserComponent` | ⬜ |
| CategoryTeaser | `JuliCategoryTeaserComponent` | `CategoryTeaserComponent` | ⬜ |
| InfoCard | `JuliInfoCardComponent` | `InfoCardComponent` | ⬜ |

---

## 🧪 Mock CMS Coverage Check

Teste todos os cenários do mock:

- [ ] `/api/pages?filters[slug][$eq]=home` → Conteúdo válido completo
- [ ] `/api/pages?filters[slug][$eq]=partial` → Conteúdo incompleto (testa fallback)
- [ ] `/api/pages?filters[slug][$eq]=unknown` → Componente desconhecido
- [ ] `/api/pages?filters[slug][$eq]=not-found` → 404
- [ ] `/api/pages?filters[slug][$eq]=error` → Erro 500 simulado
- [ ] `/api/pages?filters[slug][$eq]=empty` → Página sem componentes

---

## 🆕 Extension Readiness Check

Para validar que novos componentes podem ser adicionados:

- [ ] Adicionar novo componente não requer mudanças em código existente
- [ ] Modelo canônico pode ser estendido
- [ ] Mapper pode ser estendido
- [ ] Registry aceita novas entradas
- [ ] Teste unitário do novo componente passa

### Como adicionar novo componente (ex: InfoCard):

1. ⬜ Adicionar `InfoCardComponentModel` em `core/models/cms.model.ts`
2. ⬜ Criar schema no Strapi (ou mock)
3. ⬜ Adicionar mapper em `strapi-cms.adapter.ts` (ou criar entry separada)
4. ⬜ Registrar em `strapi-cms.module.ts` no `ConfigModule.withConfig`
5. ⬜ Criar componente Angular em `shared/components/info-card/`
6. ⬜ Adicionar teste unitário do mapper
7. ⬜ Incluir em página de demo

---

## 🚀 Integration Check (Ubris Ready)

- [ ] `CommerceResolver` interface definida
- [ ] Implementação mock existe em `core/commerce/`
- [ ] `ProductTeaser` usa resolver, não chama API diretamente
- [ ] Separação clara: CMS = código/ID; Commerce = dados

---

## 📊 Health Score

| Categoria | Checkboxes | Pass | Fail | Score |
|-----------|------------|------|------|-------|
| Boundary Rules | 3 | | | ⬜/3 |
| Model Rules | 3 | | | ⬜/3 |
| Mapping Rules | 3 | | | ⬜/3 |
| Rendering Rules | 3 | | | ⬜/3 |
| Fallback Rules | 3 | | | ⬜/3 |
| Component Registry | 7 | | | ⬜/7 |
| Mock Coverage | 6 | | | ⬜/6 |
| Extension | 7 | | | ⬜/7 |
| Ubris Ready | 4 | | | ⬜/4 |
| **TOTAL** | **39** | | | **⬜/39** |

**Critérios:**
- 🟢 90%+ (35-39): Arquitetura saudável
- 🟡 70-89% (27-34): Atenção necessária
- 🔴 <70% (<27): Bloquear release

---

## 📝 Notas da Validação

**Data:** ___/___/______  
**Validador:** _________________  
**Versão:** _________________  

### Issues Encontradas:

1. 
2. 
3. 

### Ações Corretivas:

1. 
2. 
3. 

### Aprovação:

- [ ] Arquitetura aprovada para release
- [ ] Arquitetura bloqueada - requer correções

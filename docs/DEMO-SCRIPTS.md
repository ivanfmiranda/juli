# Roteiros de Demo: JULI + UBRIS

## 🎯 Demo Executiva (2-3 minutos)

**Público**: C-level, stakeholders de negócio  
**Objetivo**: Mostrar valor de negócio e diferenciação  
**Tom**: Visionário, focado em resultados

---

### Roteiro

#### 1. Abertura (15s)
> "Vou mostrar a nova geração de e-commerce enterprise. JULI é o storefront moderno. UBRIS é o backend cloud-native. Juntos, oferecem o que SAP e VTEX não conseguem: controle total com agilidade."

#### 2. Homepage - Experiência (30s)
**Ação**: Acesse `/`

**Fala**:
> "A homepage é totalmente configurável via CMS. Marketing pode criar landing pages, campanhas, destaques... sem depender de desenvolvimento."

**Destaques**:
- Design premium
- Carregamento instantâneo
- Layout responsivo

#### 3. PLP - Discovery (30s)
**Ação**: Clique em "Eletrônicos"

**Fala**:
> "O catálogo é rápido, fluido. Paginação inteligente, filtros dinâmicos. Cada card tem informações de estoque em tempo real."

**Destaques**:
- Grid responsivo
- Badges visuais (Novo, Promoção)
- Quick add to cart

#### 4. PDP - Conversão (30s)
**Ação**: Clique em um produto

**Fala**:
> "O produto mostra variações, galeria, disponibilidade. O cliente sabe exatamente o que está comprando. Reduzimos dúvidas, aumentamos conversão."

**Destaques**:
- Galeria de imagens
- Variações (cor, tamanho)
- Status de estoque
- CTA claro

#### 5. Checkout - Finalização (30s)
**Ação**: Adicione ao carrinho → Checkout

**Fala**:
> "Checkout em poucos passos. Frete dinâmico. Múltiplos pagamentos. Tudo integrado com a operação logística em tempo real."

**Destaques**:
- Fluxo simplificado
- Opções de frete
- Segurança

#### 6. Fechamento (15s)
> "Isso é JULI + UBRIS. Moderno como VTEX, poderoso como Hybris, mas com o controle e custo que sua empresa precisa."

---

## 🔧 Demo Técnica (5-7 minutos)

**Público**: CTO, arquitetos, tech leads  
**Objetivo**: Mostrar arquitetura, extensibilidade e qualidade técnica  
**Tom**: Detalhado, focado em engenharia

---

### Roteiro

#### 1. Abertura Arquitetural (30s)
**Ação**: Mostre o diagrama de arquitetura

**Fala**:
> "JULI é um SPA Angular 12+ com arquitetura de adapters. UBRIS é Spring Boot microservices. A comunicação é REST pura, com fallback strategies e circuit breakers."

**Destaques**:
- Frontend desacoplado
- Backend-agnostic
- Cloud-native

#### 2. CMS Headless (1min)
**Ação**: Acesse `/page/home` → Mostre Strapi Admin

**Fala**:
> "O CMS é Strapi, headless, com API GraphQL e REST. Marketing cria páginas, componentes dinâmicos, sem tocar no código. Aqui temos hero banners, produtos em destaque, tudo configurável."

**Destaques**:
- Componentes dinâmicos
- Preview antes de publicar
- API para consumo

#### 3. Backend Services (1min)
**Ação**: Swagger/OpenAPI docs

**Fala**:
> "UBRIS tem 4 serviços core: Product, Cart, Checkout, Order. Cada um escala independentemente. Estamos usando PostgreSQL, Redis, Elasticsearch, RabbitMQ. Tudo containerizado."

**Destaques**:
- Documentação API
- Health checks
- Métricas Prometheus

#### 4. Adapter Pattern (1min)
**Ação**: Mostre o código do adapter

**Fala**:
> "Aqui está o pattern que permite conectar diferentes backends. Temos UbrisProductNormalizer que converte payloads Ubris para modelo canônico. Se amanhã quisermos migrar para Hybris, trocamos o adapter, não o frontend."

**Destaques**:
- UbrisProductNormalizer
- JuliProductModel
- Backend-agnostic

#### 5. Multi-tenant (30s)
**Ação**: Mostre configs de tenant

**Fala**:
> "Multi-tenant nativo. Cada tenant tem seu catálogo, preços, frete, mas compartilha a infraestrutura. Econômico para marketplace ou grupos de marcas."

#### 6. CI/CD & DevOps (1min)
**Ação**: Mostre pipeline

**Fala**:
> "Deploy automatizado via GitLab CI. Testes unitários, e2e, security scan. Docker images versionadas. Podemos fazer deploy de frontend independente de backend."

#### 7. Performance (1min)
**Ação**: Lighthouse/DevTools

**Fala**:
> "Performance é first-class. Lazy loading, code splitting, skeleton screens. O bundle é otimizado, APIs usam cache. Lighthouse scores acima de 90 em todas as métricas."

**Destaques**:
- Lighthouse scores
- Network throttling
- Bundle analysis

---

## 💡 Demo de Migração (3-4 minutos)

**Público**: Clientes com legado Hybris/SAP  
**Objetivo**: Mostrar caminho de migração seguro  
**Tom**: Reassuring, focado em redução de risco

---

### Roteiro

#### 1. O Problema (30s)
> "Hybris é poderoso, mas caro, lento para mudar, e vendor lock-in. Muitos clientes querem modernizar mas têm medo do big bang."

#### 2. A Solução: Migração Gradual (1min)
**Ação**: Mostre arquitetura híbrida

**Fala**:
> "Com JULI, você moderniza frontend primeiro, conectando ao Hybris existente via OCC. Depois migra serviços um a um. Zero downtime, rollback a qualquer momento."

#### 3. Fase 1: Frontend (30s)
**Ação**: Demo JULI + Hybris

**Fala**:
> "Fase 1: JULI storefront com Hybris backend. Cliente vê melhoria imediata. SEO, performance, UX. Backend continua igual."

#### 4. Fase 2: Serviços Core (1min)
**Ação**: Mostre UBRIS subindo

**Fala**:
> "Fase 2: Subimos UBRIS paralelo. Migramos catálogo, depois carrinho. Feature flags controlam tráfego. Se algo falha, volta para Hybris instantaneamente."

#### 5. Fase 3: Go-live (30s)
**Fala**:
> "Quando tudo validado, desligamos Hybris. Investimento protegido, risco distribuído."

---

## 📋 Checklist Pré-Demo

### Técnico
- [ ] Build estável (`npm run build` passa)
- [ ] Servidor rodando na porta 4200
- [ ] UBRIS backend respondendo
- [ ] Strapi com conteúdo de demo
- [ ] Produtos cadastrados
- [ ] Imagens carregando
- [ ] Checkout funcional

### Conteúdo
- [ ] Homepage com hero banner
- [ ] Categoria "Eletrônicos" com 6+ produtos
- [ ] Produto com variações
- [ ] Carrinho pré-populado (opcional)

### Ambiente
- [ ] Tela limpa (sem notificações)
- [ ] Chrome em modo apresentação
- [ ] DevTools fechado (ou aberto só se necessário)
- [ ] Conexão estável
- [ ] Backup: screenshots caso algo falhe

---

## 🎭 Adaptação por Persona

### Para CMO (Marketing)
Foque em: CMS, flexibilidade de conteúdo, velocidade de campanhas  
Demo: Homepage, landing pages, componentes dinâmicos

### Para CTO (Tecnologia)
Foque em: Arquitetura, código limpo, extensibilidade  
Demo: Adapters, código, documentação API

### Para CFO (Financeiro)
Foque em: TCO, previsibilidade de custo, ROI  
Demo: Comparativos de preço, case studies

### Para COO (Operações)
Foque em: Integrações logísticas, gestão de pedidos, fulfillment  
Demo: Orders, integração Melhor Envio, dashboard

---

## 🚨 Handling Objections

### "Isso não é só mais um e-commerce?"
> "Não. JULI+UBRIS é arquitetura desacoplada moderna. VTEX e Shopify são SaaS limitados. Hybris é monolito pesado. Nós entregamos o meio-termo: flexibilidade + poder + controle."

### "Por que não usar VTEX/Shopify?"
> "Se você precisa de customizações profundas, integrações complexas, ou quer evitar vendor lock-in, SaaS limita. Com JULI+UBRIS, você é dono da plataforma."

### "E o custo de manter?"
> "TCO é 30-50% menor que Hybris, comparável a VTEX Plus para operações grandes. Diferença: previsibilidade. Sem surpresas de licenciamento."

### "Nosso time usa Hybris há anos..."
> "Perfeito. Migração pode ser gradual. Mantém Hybris enquanto constrói novo. Zero big bang. Time aprende novo stack sem pressão."

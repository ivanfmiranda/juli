# Posicionamento de Produto: JULI + UBRIS

## Visão de Produto

**JULI** e **UBRIS** são dois produtos complementares que juntos formam uma plataforma de e-commerce completa, moderna e desacoplada.

---

## 🏪 JULI: Headless Storefront Premium

### O que é
JULI é um **frontend de e-commerce moderno**, construído com Angular e arquitetura headless. É o "rosto" da loja virtual — o que o cliente vê e interage.

### Proposta de Valor
> "Storefront enterprise-ready, sem o peso do legacy"

### Características
- **Tecnologia moderna**: Angular 12+, RxJS, TypeScript
- **Backend-agnostic**: Funciona com Ubris, Hybris, ou qualquer API de comércio
- **CMS integrado**: Strapi para conteúdo dinâmico
- **Design premium**: UI/UX polida, responsiva, acessível
- **Performance**: SPA (Single Page Application), carregamento rápido
- **Extensível**: Arquitetura de adapters para múltiplos backends

### Para quem é
- Empresas que querem migrar de Hybris/VTEX/Salesforce sem reescrever tudo
- Times que precisam de storefront moderno sem comprometer backend existente
- Projetos que precisam de flexibilidade de CMS + commerce

### Diferenciais
✅ Não acopla frontend ao backend  
✅ Migração gradual (página por página)  
✅ CMS desacoplado (Strapi)  
✅ Código limpo, sem legacy  
✅ Multi-tenant ready  

---

## ⚙️ UBRIS: Commerce Engine Distribuído

### O que é
UBRIS é um **backend de e-commerce distribuído**, construído com microserviços Java. É o "cérebro" da operação — regras de negócio, estoque, pedidos, pagamentos.

### Proposta de Valor
> "Commerce engine cloud-native, sem complexidade enterprise"

### Características
- **Microserviços**: Catálogo, Carrinho, Checkout, Pedidos, Pagamentos
- **Cloud-native**: Docker, Kubernetes, escalabilidade horizontal
- **API-first**: RESTful APIs, pronto para headless
- **Multi-tenant**: Suporte a múltiplas marcas/lojas
- **Integrações**: Melhor Envio, Strapi, gateways de pagamento
- **Observabilidade**: Logs, métricas, health checks

### Para quem é
- Empresas que precisam de backend robusto sem custo de SAP/Hybris
- Startups em crescimento que precisam de infraestrutura escalável
- Projetos que querem evitar vendor lock-in

### Diferenciais
✅ Previsível (sem surpresas de licenciamento)  
✅ Código aberto (sem vendor lock-in)  
✅ Cloud-native (escala sob demanda)  
✅ Integrações brasileiras (Melhor Envio, PIX)  
✅ Menor TCO que soluções enterprise tradicionais  

---

## 🤝 JULI + UBRIS: A Plataforma Completa

### Juntos oferecem:
| Camada | Produto | Tecnologia |
|--------|---------|------------|
| **Frontend** | JULI | Angular + Spartacus |
| **Backend** | UBRIS | Java + Spring Boot |
| **CMS** | Strapi | Node.js |
| **Search** | Elasticsearch | Elasticsearch |
| **Database** | PostgreSQL | PostgreSQL |
| **Message Queue** | RabbitMQ | RabbitMQ |

### Arquitetura
```
┌─────────────────────────────────────────────────────────┐
│                      JULI (Frontend)                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │   CMS   │ │   PLP   │ │   PDP   │ │  Cart   │       │
│  │  Pages  │ │  Grid   │ │  Detail │ │ Checkout│       │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │
└───────┼───────────┼───────────┼───────────┼─────────────┘
        │           │           │           │
        └───────────┴─────┬─────┴───────────┘
                          │ HTTPS/JSON
┌─────────────────────────┼───────────────────────────────┐
│                    UBRIS (Backend)                       │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Product │ │  Cart   │ │Checkout │ │  Order  │       │
│  │ Service │ │ Service │ │ Service │ │ Service │       │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘       │
│       └───────────┴─────┬─────┴───────────┘             │
│                         │                                │
│              ┌──────────┴──────────┐                    │
│              │   API Gateway       │                    │
│              └─────────────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Narrativa de Venda

### Versão Elevator Pitch (30 segundos)
> "JULI é um storefront headless moderno que conecta a qualquer backend de e-commerce. UBRIS é o backend cloud-native que alimenta esse storefront. Juntos, oferecem uma plataforma completa sem o peso e custo das soluções enterprise tradicionais."

### Versão Executiva (2 minutos)
> "O mercado de e-commerce enterprise está preso entre duas pontas: soluções monolíticas pesadas como Hybris, ou SaaS limitados como VTEX. 
> 
> JULI + UBRIS oferecem uma terceira via: arquitetura moderna, desacoplada, cloud-native, mas com o controle e flexibilidade que empresas em crescimento precisam.
> 
> JULI cuida da experiência do cliente — storefront rápido, CMS flexível, design premium. UBRIS cuida da operação — estoque, pedidos, pagamentos, integrações logísticas.
> 
> O resultado? Time-to-market rápido, custo previsível, e liberdade para evoluir sem vendor lock-in."

---

## 💰 Modelo de Negócio

### JULI
- **Licenciamento**: Código aberto (MIT) + serviços de implementação
- **Serviços**: Setup, customização, integrações, suporte
- **Target**: Agências, integradores, times internos

### UBRIS
- **Licenciamento**: Código aberto (MIT) + serviços cloud
- **Serviços**: Hospedagem managed, suporte 24/7, integrações
- **Target**: Retailers, marketplaces, B2B commerce

### Pacote Combinado
- **JULI + UBRIS**: Implementação + Hospedagem + Suporte
- **Preço**: SaaS fee mensal (GMV-based) ou projeto fixo

---

## 📊 Proposta de Valor Consolidada

| Para | JULI resolve | UBRIS resolve |
|------|--------------|---------------|
| **CMO/Marketing** | Experiência premium, CMS flexível, campanhas dinâmicas | - |
| **CTO/Tecnologia** | Frontend moderno, fácil manter, sem débito técnico | Backend escalável, APIs limpas, cloud-native |
| **CEO/Negócio** | Conversão, brand experience | Operação robusta, custo previsível |
| **Operações** | - | Integrações logísticas, pagamentos, estoque |

---

## 🔑 Mensagens-chave

### Para Executivos
- "Modernize seu e-commerce sem jogar fora o que funciona"
- "Cresça sem limites de plataforma"
- "Controle total, custo previsível"

### Para Técnicos
- "Arquitetura hexagonal, backend-agnostic"
- "Microserviços prontos para cloud"
- "Código limpo, testável, documentado"

### Para Marketing
- "CMS headless + storefront premium"
- "Landing pages dinâmicas sem dev"
- "Experiência mobile-first"

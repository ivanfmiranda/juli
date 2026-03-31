#!/usr/bin/env node
'use strict';

/**
 * Seed script — populates Strapi with demo pages for the Page Builder.
 * Usage: STRAPI_TOKEN=<admin-jwt> node scripts/seed-catalog.js
 */

const http = require('http');

const BASE = process.env.STRAPI_URL || 'http://localhost:1337';
const TOKEN = process.env.STRAPI_TOKEN;
if (!TOKEN) {
  console.error('Set STRAPI_TOKEN env var (admin JWT)');
  process.exit(1);
}

// ── Helpers ──

function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE);
    const payload = body ? JSON.stringify(body) : null;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method,
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
          ...(payload ? { 'Content-Length': Buffer.byteLength(payload) } : {}),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, data });
          }
        });
      }
    );
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function img(w, h, id) {
  return `https://picsum.photos/id/${id}/${w}/${h}`;
}

// ── Block builders ──

let blockId = 0;
function block(type, props) {
  return { id: `seed-${++blockId}`, type, props };
}

// ── Page definitions ──

const PAGES = [
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // HOME
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    title: 'Home',
    slug: 'home',
    tenantKey: 'default',
    layout: [
      block('Banner', {
        title: 'Bem-vindo à Ubris Store',
        subtitle: 'Tecnologia, estilo e inovação em um só lugar. Frete grátis acima de R$ 199.',
        imageUrl: img(600, 400, 1),
        ctaLabel: 'Ver Ofertas',
        ctaUrl: '/pages/promocoes',
        bgColor: '#eef2ff',
      }),
      block('SpacerBlock', { height: 32 }),
      block('ProductGrid', {
        title: 'Mais Vendidos',
        categoryId: 'eletronicos',
        maxItems: 4,
        columns: '4',
      }),
      block('CarouselBlock', {
        items: [
          { imageUrl: img(1200, 400, 1015), link: '/pages/promocoes' },
          { imageUrl: img(1200, 400, 1025), link: '/pages/lancamentos' },
          { imageUrl: img(1200, 400, 1035), link: '/pages/colecao-verao' },
        ],
      }),
      block('SpacerBlock', { height: 24 }),
      block('TextBlock', {
        content: '<h2>Por que escolher a Ubris?</h2><p>Mais de <strong>10.000 produtos</strong> com entrega rápida em todo o Brasil. Pagamento seguro via Stripe, Mercado Pago e PIX. Suporte 24/7 por chat e e-mail.</p>',
        alignment: 'center',
      }),
      block('SpacerBlock', { height: 24 }),
      block('ProductGrid', {
        title: 'Lançamentos',
        categoryId: 'lancamentos',
        maxItems: 3,
        columns: '3',
      }),
      block('Banner', {
        title: 'Oferta Relâmpago',
        subtitle: 'Até 50% OFF em eletrônicos selecionados. Válido até domingo!',
        imageUrl: img(500, 350, 180),
        ctaLabel: 'Aproveitar',
        ctaUrl: '/pages/promocoes',
        bgColor: '#fef3c7',
      }),
      block('SpacerBlock', { height: 24 }),
      block('VideoBlock', {
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        caption: 'Conheça a Ubris Store — Nossa história',
        aspectRatio: '16:9',
        autoplay: false,
      }),
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // PROMOÇÕES
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    title: 'Promoções',
    slug: 'promocoes',
    tenantKey: 'default',
    layout: [
      block('Banner', {
        title: 'Promoções Imperdíveis',
        subtitle: 'Os melhores preços da temporada. Descubra ofertas exclusivas em todas as categorias.',
        imageUrl: img(600, 400, 26),
        ctaLabel: 'Ver Todos',
        ctaUrl: '#produtos',
        bgColor: '#fef2f2',
      }),
      block('SpacerBlock', { height: 32 }),
      block('ProductGrid', {
        title: 'Eletrônicos com até 40% OFF',
        categoryId: 'eletronicos-promo',
        maxItems: 4,
        columns: '4',
      }),
      block('SpacerBlock', { height: 16 }),
      block('ProductGrid', {
        title: 'Moda & Acessórios',
        categoryId: 'moda-promo',
        maxItems: 3,
        columns: '3',
      }),
      block('Banner', {
        title: 'Cupom UBRIS20',
        subtitle: '20% de desconto na primeira compra. Use o cupom no checkout!',
        bgColor: '#ecfdf5',
        ctaLabel: 'Usar Cupom',
        ctaUrl: '/checkout',
      }),
      block('SpacerBlock', { height: 16 }),
      block('CarouselBlock', {
        items: [
          { imageUrl: img(1200, 400, 160), link: '/c/smartphones' },
          { imageUrl: img(1200, 400, 201), link: '/c/notebooks' },
          { imageUrl: img(1200, 400, 239), link: '/c/acessorios' },
          { imageUrl: img(1200, 400, 250), link: '/c/casa' },
        ],
      }),
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // SOBRE NÓS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    title: 'Sobre Nós',
    slug: 'sobre',
    tenantKey: 'default',
    layout: [
      block('Banner', {
        title: 'Sobre a Ubris',
        subtitle: 'Transformando o e-commerce brasileiro desde 2024.',
        imageUrl: img(600, 400, 366),
        bgColor: '#f0f9ff',
      }),
      block('SpacerBlock', { height: 32 }),
      block('TextBlock', {
        content: `<h2>Nossa Missão</h2>
<p>A Ubris nasceu com uma missão clara: <strong>democratizar o acesso a ferramentas de e-commerce de alta performance</strong>. Acreditamos que toda empresa, independente do tamanho, merece uma plataforma robusta, escalável e fácil de usar.</p>

<h3>O que nos diferencia</h3>
<ul>
  <li><strong>Multi-tenant nativo</strong> — Uma única instalação serve múltiplas lojas com isolamento completo.</li>
  <li><strong>Integrações prontas</strong> — Stripe, Mercado Pago, PIX, Tiny ERP e SMTP configuráveis em minutos.</li>
  <li><strong>Page Builder visual</strong> — Crie páginas com drag-and-drop, sem precisar de desenvolvedores.</li>
  <li><strong>SEO first</strong> — Server-side rendering para todas as páginas do Page Builder.</li>
</ul>`,
        alignment: 'left',
      }),
      block('SpacerBlock', { height: 24 }),
      block('VideoBlock', {
        videoUrl: 'https://www.youtube.com/watch?v=jNQXAC9IVRw',
        caption: 'Como funciona a plataforma Ubris',
        aspectRatio: '16:9',
      }),
      block('SpacerBlock', { height: 32 }),
      block('TextBlock', {
        content: `<h2>Nossos Números</h2>
<p style="font-size:18px;text-align:center;">
  <strong>34</strong> microserviços &nbsp;|&nbsp;
  <strong>5</strong> integrações nativas &nbsp;|&nbsp;
  <strong>9</strong> tipos de bloco &nbsp;|&nbsp;
  <strong>∞</strong> possibilidades
</p>`,
        alignment: 'center',
      }),
      block('SpacerBlock', { height: 24 }),
      block('MapBlock', {
        address: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
        lat: '-23.5613',
        lng: '-46.6558',
        zoom: 16,
        height: 350,
      }),
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // CONTATO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    title: 'Contato',
    slug: 'contato',
    tenantKey: 'default',
    layout: [
      block('Banner', {
        title: 'Fale Conosco',
        subtitle: 'Estamos aqui para ajudar. Envie sua mensagem e retornamos em até 24h.',
        bgColor: '#f5f3ff',
      }),
      block('SpacerBlock', { height: 32 }),
      block('FormBlock', {
        title: 'Envie sua Mensagem',
        submitLabel: 'Enviar Mensagem',
        endpoint: '/strapi-api/contact-submissions',
        fields: [
          { label: 'Nome Completo', type: 'text', required: true, placeholder: 'Seu nome' },
          { label: 'E-mail', type: 'email', required: true, placeholder: 'seu@email.com' },
          { label: 'Telefone', type: 'tel', required: false, placeholder: '(11) 99999-9999' },
          { label: 'Assunto', type: 'select', required: true, placeholder: 'Selecione...' },
          { label: 'Mensagem', type: 'textarea', required: true, placeholder: 'Descreva sua dúvida ou sugestão...' },
        ],
      }),
      block('SpacerBlock', { height: 32 }),
      block('TextBlock', {
        content: `<h3>Outros canais</h3>
<p><strong>E-mail:</strong> suporte@ubris.com.br<br/>
<strong>WhatsApp:</strong> (11) 91234-5678<br/>
<strong>Horário:</strong> Seg-Sex, 9h às 18h</p>`,
        alignment: 'left',
      }),
      block('SpacerBlock', { height: 24 }),
      block('MapBlock', {
        address: 'Av. Paulista, 1578 - Bela Vista, São Paulo - SP',
        lat: '-23.5613',
        lng: '-46.6558',
        zoom: 16,
        height: 300,
      }),
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // LANÇAMENTOS
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    title: 'Lançamentos',
    slug: 'lancamentos',
    tenantKey: 'default',
    layout: [
      block('Banner', {
        title: 'Novidades na Ubris',
        subtitle: 'Descubra os produtos recém-chegados. Seja o primeiro a experimentar!',
        imageUrl: img(600, 400, 48),
        ctaLabel: 'Explorar',
        ctaUrl: '#novidades',
        bgColor: '#fdf4ff',
      }),
      block('SpacerBlock', { height: 32 }),
      block('ProductGrid', {
        title: 'Acabaram de Chegar',
        categoryId: 'novidades',
        maxItems: 4,
        columns: '4',
      }),
      block('SpacerBlock', { height: 16 }),
      block('CarouselBlock', {
        items: [
          { imageUrl: img(1200, 400, 119), link: '/product/smartwatch-ultra' },
          { imageUrl: img(1200, 400, 160), link: '/product/fone-pro-max' },
          { imageUrl: img(1200, 400, 180), link: '/product/tablet-air' },
        ],
      }),
      block('SpacerBlock', { height: 24 }),
      block('VideoBlock', {
        videoUrl: 'https://www.youtube.com/watch?v=9bZkp7q19f0',
        caption: 'Unboxing dos lançamentos de Março 2026',
        aspectRatio: '16:9',
      }),
      block('SpacerBlock', { height: 24 }),
      block('TextBlock', {
        content: '<h3>Pré-venda exclusiva</h3><p>Cadastre-se na nossa newsletter e tenha acesso antecipado a todos os lançamentos com <strong>15% de desconto</strong>.</p>',
        alignment: 'center',
      }),
      block('FormBlock', {
        title: 'Cadastre-se na Newsletter',
        submitLabel: 'Quero Receber Novidades',
        endpoint: '/strapi-api/newsletter-subscriptions',
        fields: [
          { label: 'Nome', type: 'text', required: true, placeholder: 'Seu nome' },
          { label: 'E-mail', type: 'email', required: true, placeholder: 'seu@email.com' },
        ],
      }),
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // COLEÇÃO VERÃO
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    title: 'Coleção Verão 2026',
    slug: 'colecao-verao',
    tenantKey: 'default',
    layout: [
      block('Banner', {
        title: 'Coleção Verão 2026',
        subtitle: 'Cores vibrantes e tecidos leves para os dias mais quentes do ano.',
        imageUrl: img(600, 400, 1058),
        ctaLabel: 'Comprar Agora',
        ctaUrl: '/c/verao-2026',
        bgColor: '#fffbeb',
      }),
      block('SpacerBlock', { height: 24 }),
      block('CarouselBlock', {
        items: [
          { imageUrl: img(1200, 500, 1062), link: '/c/camisetas' },
          { imageUrl: img(1200, 500, 1064), link: '/c/bermudas' },
          { imageUrl: img(1200, 500, 1068), link: '/c/vestidos' },
          { imageUrl: img(1200, 500, 1069), link: '/c/calcados' },
        ],
      }),
      block('SpacerBlock', { height: 24 }),
      block('ProductGrid', {
        title: 'Tendências do Verão',
        categoryId: 'verao-2026',
        maxItems: 4,
        columns: '4',
      }),
      block('SpacerBlock', { height: 16 }),
      block('ProductGrid', {
        title: 'Acessórios para a Praia',
        categoryId: 'praia',
        maxItems: 3,
        columns: '3',
      }),
      block('SpacerBlock', { height: 24 }),
      block('HtmlBlock', {
        html: `<div style="background:linear-gradient(135deg,#ff6b35,#f7c948);padding:48px 32px;border-radius:12px;text-align:center;color:#fff;">
  <h2 style="margin:0 0 12px;font-size:32px;font-weight:800;">FRETE GRÁTIS</h2>
  <p style="margin:0;font-size:18px;opacity:0.9;">Em toda a coleção Verão 2026 para compras acima de R$ 149</p>
</div>`,
      }),
      block('SpacerBlock', { height: 24 }),
      block('TextBlock', {
        content: '<p style="font-size:14px;color:#888;text-align:center;">Oferta válida até 28/02/2026 ou enquanto durarem os estoques. Não acumulável com outros cupons.</p>',
        alignment: 'center',
      }),
    ],
  },

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // POLÍTICA DE PRIVACIDADE
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  {
    title: 'Política de Privacidade',
    slug: 'privacidade',
    tenantKey: 'default',
    layout: [
      block('Banner', {
        title: 'Política de Privacidade',
        subtitle: 'Última atualização: Março 2026',
        bgColor: '#f8fafc',
      }),
      block('TextBlock', {
        content: `<h2>1. Coleta de Dados</h2>
<p>Coletamos apenas os dados necessários para processar suas compras e melhorar sua experiência: nome, e-mail, endereço de entrega e dados de pagamento (processados de forma segura via Stripe/Mercado Pago).</p>

<h2>2. Uso dos Dados</h2>
<p>Seus dados são utilizados exclusivamente para:</p>
<ul>
  <li>Processar e entregar seus pedidos</li>
  <li>Enviar comunicações sobre status de pedidos</li>
  <li>Melhorar nossos serviços (dados anonimizados)</li>
  <li>Cumprir obrigações legais</li>
</ul>

<h2>3. Compartilhamento</h2>
<p>Não vendemos nem compartilhamos seus dados pessoais com terceiros, exceto parceiros logísticos necessários para entrega e processadores de pagamento.</p>

<h2>4. Segurança</h2>
<p>Utilizamos criptografia AES-256-GCM para dados sensíveis e HTTPS em todas as comunicações. Nossos servidores são monitorados 24/7.</p>

<h2>5. Seus Direitos (LGPD)</h2>
<p>Você tem direito a acessar, corrigir, excluir ou solicitar portabilidade dos seus dados. Entre em contato pelo e-mail <strong>privacidade@ubris.com.br</strong>.</p>`,
        alignment: 'left',
      }),
    ],
  },
];

// ── Main ──

async function main() {
  console.log(`Seeding ${PAGES.length} pages...\n`);

  // Grant public read for layout-versions
  try {
    await api('GET', '/api/layout-versions');
  } catch {}

  for (const page of PAGES) {
    const { title, slug, tenantKey, layout } = page;

    // Check if page already exists
    const existing = await api('GET', `/content-manager/collection-types/api::page.page?filters[slug][$eq]=${slug}&filters[tenantKey][$eq]=${tenantKey}`);

    let pageId;
    if (existing.data?.results?.length > 0) {
      pageId = existing.data.results[0].id;
      console.log(`  ✓ "${title}" already exists (id=${pageId}), updating layout...`);
      await api('PUT', `/content-manager/collection-types/api::page.page/${pageId}`, {
        layout,
      });
    } else {
      console.log(`  + Creating "${title}" (slug=${slug})...`);
      const created = await api('POST', '/content-manager/collection-types/api::page.page', {
        title,
        slug,
        tenantKey,
        layout,
        locale: 'pt',
      });
      if (created.status >= 400) {
        console.error(`    FAILED:`, JSON.stringify(created.data?.error || created.data));
        continue;
      }
      pageId = created.data?.id;
      console.log(`    Created id=${pageId}`);
    }

    // Publish the page
    if (pageId) {
      const pub = await api(
        'POST',
        `/content-manager/collection-types/api::page.page/${pageId}/actions/publish`
      );
      if (pub.status < 300) {
        console.log(`    Published ✓`);
      } else {
        console.log(`    Publish status: ${pub.status}`);
      }
    }

    // Create initial version
    if (pageId) {
      await api('POST', '/content-manager/collection-types/api::layout-version.layout-version', {
        pageId,
        version: 1,
        layout,
        description: 'Versão inicial (seed)',
        createdByName: 'Seed Script',
      });
    }
  }

  console.log(`\nDone! ${PAGES.length} pages seeded and published.`);
  console.log('Access the storefront at /pages/<slug> to see them rendered.');
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});

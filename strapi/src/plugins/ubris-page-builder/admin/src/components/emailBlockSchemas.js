// Schemas for the email-template editor. Keys match the backend record
// names in com.ubris.automation.notification.template.EmailBlock:
// Heading / Paragraph / Button / Divider / Info / Image. They get
// lowercased before sending to the API (see EmailTemplatesPage.jsx).

export const EMAIL_BLOCK_SCHEMAS = {
  Heading: {
    label: 'Título',
    icon: '📰',
    fields: [
      { key: 'text', label: 'Texto', type: 'text', placeholder: 'Ex.: Olá, {{customerName}}' },
      { key: 'level', label: 'Nível', type: 'select', options: ['1', '2', '3'] },
    ],
  },
  Paragraph: {
    label: 'Parágrafo',
    icon: '📝',
    fields: [
      { key: 'text', label: 'Texto', type: 'textarea', placeholder: 'Use {{placeholder}} para valores dinâmicos.' },
    ],
  },
  Button: {
    label: 'Botão',
    icon: '🔘',
    fields: [
      { key: 'label', label: 'Texto do botão', type: 'text', placeholder: 'Ex.: Acessar loja' },
      { key: 'href', label: 'Link', type: 'text', placeholder: '{{storefrontUrl}}' },
      { key: 'color', label: 'Cor de fundo', type: 'color', placeholder: '#274060' },
    ],
  },
  Divider: {
    label: 'Separador',
    icon: '➖',
    fields: [],
  },
  Info: {
    label: 'Caixa de informação',
    icon: '💡',
    fields: [
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Ex.: Seu pedido' },
      { key: 'text', label: 'Conteúdo', type: 'textarea', placeholder: 'Ex.: Pedido #{{orderId}}' },
      { key: 'background', label: 'Fundo', type: 'color', placeholder: '#f8fafc' },
      { key: 'borderColor', label: 'Borda', type: 'color', placeholder: '#e2e8f0' },
    ],
  },
  Image: {
    label: 'Imagem',
    icon: '🖼️',
    fields: [
      { key: 'src', label: 'URL da imagem', type: 'text', placeholder: 'https://…' },
      { key: 'alt', label: 'Texto alternativo', type: 'text' },
      { key: 'width', label: 'Largura (px)', type: 'number', placeholder: '600' },
    ],
  },
};

export const EMAIL_BLOCK_TYPES = Object.keys(EMAIL_BLOCK_SCHEMAS);

// Well-known template codes the backend already handles. Users can also
// type arbitrary codes if they've added a new handler in NotificationService.
export const KNOWN_EMAIL_CODES = [
  'customer-welcome',
  'password-reset',
  'order-confirmation',
  'order-cancelled',
  'payment-success',
  'payment-failed',
  'shipment-notification',
  'shipment-delivered',
  'invoice-issued',
  'capture-failed',
  'cart-abandonment',
];

// Sample variable payload used by the Preview button so the iframe shows
// realistic substitutions instead of empty {{placeholders}}.
export const SAMPLE_VARIABLES = {
  customerName: 'Ivan Miranda',
  tenantName: 'K2 Demo',
  storefrontUrl: 'https://k2.ubris.com.br',
  orderId: '1234567',
  trackingCode: 'BR123456789XY',
  resetLink: 'https://k2.ubris.com.br/reset?token=abc123',
  expiresInMinutes: '30',
  invoiceNumber: 'NF-12345',
  reason: 'Cliente desistiu da compra',
  retryLink: 'https://k2.ubris.com.br/checkout/retry',
  supportLink: 'https://k2.ubris.com.br/suporte',
  orderLink: 'https://k2.ubris.com.br/orders/1234567',
};

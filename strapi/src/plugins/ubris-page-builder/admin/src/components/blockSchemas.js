export const BLOCK_SCHEMAS = {
  Banner: {
    label: 'Banner',
    icon: '🖼️',
    fields: [
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Título do banner' },
      { key: 'subtitle', label: 'Subtítulo', type: 'text', placeholder: 'Subtítulo' },
      { key: 'imageUrl', label: 'URL da Imagem', type: 'text', placeholder: 'https://...' },
      { key: 'ctaLabel', label: 'Texto do Botão', type: 'text', placeholder: 'Saiba mais' },
      { key: 'ctaUrl', label: 'Link do Botão', type: 'text', placeholder: '/pagina' },
      { key: 'bgColor', label: 'Cor de Fundo', type: 'color', placeholder: '#ffffff' },
    ],
  },
  TextBlock: {
    label: 'Texto',
    icon: '📝',
    fields: [
      { key: 'content', label: 'Conteúdo', type: 'textarea', placeholder: 'Escreva seu texto...' },
      { key: 'alignment', label: 'Alinhamento', type: 'select', options: ['left', 'center', 'right'] },
    ],
  },
  ProductGrid: {
    label: 'Grade de Produtos',
    icon: '🛍️',
    fields: [
      { key: 'title', label: 'Título', type: 'text', placeholder: 'Produtos em destaque' },
      { key: 'categoryId', label: 'Código da Categoria', type: 'text', placeholder: 'eletronicos' },
      { key: 'maxItems', label: 'Máx. Itens', type: 'number', placeholder: '4' },
      { key: 'columns', label: 'Colunas', type: 'select', options: ['2', '3', '4'] },
    ],
  },
  CarouselBlock: {
    label: 'Carrossel',
    icon: '🎠',
    fields: [
      { key: 'items', label: 'Slides', type: 'carousel-items' },
    ],
  },
  HtmlBlock: {
    label: 'HTML',
    icon: '💻',
    fields: [
      { key: 'html', label: 'Código HTML', type: 'textarea', placeholder: '<div>...</div>' },
    ],
  },
  SpacerBlock: {
    label: 'Espaçador',
    icon: '↕️',
    fields: [
      { key: 'height', label: 'Altura (px)', type: 'number', placeholder: '40' },
    ],
  },
  VideoBlock: {
    label: 'Vídeo',
    icon: '🎬',
    fields: [
      { key: 'videoUrl', label: 'URL do Vídeo (YouTube/Vimeo)', type: 'text', placeholder: 'https://...' },
      { key: 'caption', label: 'Legenda', type: 'text', placeholder: 'Legenda do vídeo' },
      { key: 'aspectRatio', label: 'Proporção', type: 'select', options: ['16:9', '4:3', '1:1'] },
      { key: 'autoplay', label: 'Autoplay', type: 'boolean' },
    ],
  },
  FormBlock: {
    label: 'Formulário',
    icon: '📋',
    fields: [
      { key: 'title', label: 'Título do Formulário', type: 'text', placeholder: 'Entre em contato' },
      { key: 'submitLabel', label: 'Texto do Botão', type: 'text', placeholder: 'Enviar' },
      { key: 'endpoint', label: 'URL de Envio (POST)', type: 'text', placeholder: 'https://...' },
      { key: 'fields', label: 'Campos', type: 'form-fields' },
    ],
  },
  MapBlock: {
    label: 'Mapa',
    icon: '📍',
    fields: [
      { key: 'address', label: 'Endereço', type: 'text', placeholder: 'Rua, Cidade, Estado' },
      { key: 'lat', label: 'Latitude', type: 'text', placeholder: '-23.5505' },
      { key: 'lng', label: 'Longitude', type: 'text', placeholder: '-46.6333' },
      { key: 'zoom', label: 'Zoom (1-20)', type: 'number', placeholder: '15' },
      { key: 'height', label: 'Altura (px)', type: 'number', placeholder: '400' },
    ],
  },
};

export const BLOCK_TYPES = Object.keys(BLOCK_SCHEMAS);

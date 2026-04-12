import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { distinctUntilChanged, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface JuliLocaleConfig {
  code: string;
  language: string;
  label: string;
  currency: string;
}

interface TranslationTree {
  [key: string]: string | TranslationTree;
}

const STORAGE_KEY = 'juli.locale';

const TRANSLATIONS: Record<string, TranslationTree> = {
  'pt-BR': {
    login: {
      subtitle: 'Acesse sua conta',
      username: 'Usuário',
      password: 'Senha',
      signIn: 'Entrar',
      signingIn: 'Entrando...',
      noAccount: 'Ainda não tem conta?',
      createAccount: 'Cadastre-se',
      invalidCredentials: 'Usuário ou senha inválidos.',
      cartPromotionWarning: 'Login concluído, mas não foi possível recuperar o carrinho anterior.',
      usernameRequired: 'Usuário é obrigatório',
      passwordRequired: 'Senha é obrigatória'
    },
    register: {
      subtitle: 'Crie sua conta',
      email: 'E-mail',
      emailPlaceholder: 'seu@email.com',
      password: 'Senha',
      passwordPlaceholder: 'Mínimo 8 caracteres',
      confirmPassword: 'Confirmar senha',
      confirmPasswordPlaceholder: 'Repita a senha',
      createAccount: 'Criar conta',
      creating: 'Criando...',
      hasAccount: 'Já tem conta?',
      signIn: 'Entrar',
      emailRequired: 'E-mail é obrigatório',
      emailInvalid: 'E-mail inválido',
      passwordRequired: 'Senha é obrigatória',
      passwordMinLength: 'Mínimo de 8 caracteres',
      passwordMismatch: 'As senhas não conferem',
      emailConflict: 'Este e-mail já está cadastrado.',
      genericError: 'Não foi possível criar a conta. Tente novamente.'
    },
    cart: {
      empty: {
        title: 'Seu carrinho está vazio',
        description: 'Você ainda não adicionou produtos.',
        browseCatalog: 'Explorar catálogo'
      },
      title: 'Seu Carrinho',
      eyebrow: 'Carrinho de Compras',
      item: 'item',
      items: 'itens',
      each: 'cada',
      removeItem: 'Remover item',
      proceedToCheckout: 'Ir para o checkout',
      continueShopping: 'Continuar comprando',
      orderSummary: 'Resumo do pedido',
      subtotal: 'Subtotal',
      discounts: 'Descontos',
      estimatedTax: 'Impostos estimados',
      estimatedTotal: 'Total estimado',
      secureNote: 'Checkout seguro. Seus dados estão protegidos.'
    },
    header: {
      promo: 'Frete grátis em compras acima de R$ 199 | 10% OFF na primeira compra',
      menu: 'Menu',
      searchPlaceholder: 'O que você está procurando?',
      searchAria: 'Buscar produtos',
      account: 'Minha Conta',
      signIn: 'Entrar',
      register: 'Cadastrar',
      logout: 'Sair',
      cart: 'Carrinho',
      sale: 'Promoções',
      locale: 'Idioma'
    },
    footer: {
      newsletterTitle: 'Fique por dentro das novidades',
      newsletterText: 'Cadastre-se e receba ofertas exclusivas e novidades em primeira mão',
      newsletterPlaceholder: 'Seu melhor e-mail',
      newsletterButton: 'Cadastrar',
      newsletterSuccess: 'E-mail cadastrado com sucesso!',
      newsletterError: 'Não foi possível cadastrar. Tente novamente.',
      tagline: 'Sua loja online de confiança. Os melhores produtos com entrega rápida.',
      shop: 'Loja',
      help: 'Ajuda',
      company: 'Empresa',
      contact: 'Contato',
      support24h: 'Atendimento 24h',
      rights: 'Todos os direitos reservados.',
      privacy: 'Privacidade',
      terms: 'Termos',
      cookies: 'Cookies'
    },
    commerce: {
      viewProduct: 'Ver produto',
      addToCart: 'Adicionar ao carrinho',
      browseCategory: 'Explorar categoria',
      cmsGridEmpty: 'Nenhum produto foi encontrado para este bloco.',
      cmsGridViewAll: 'Ver todos'
    },
    search: {
      eyebrow: 'Busca',
      resultsFor: 'Resultados para "{{query}}"',
      searchCatalog: 'Buscar no catálogo',
      productsCount: '{{count}} produtos',
      noProducts: 'Nenhum produto encontrado',
      noProductsHint: 'Tente outra busca ou navegue pelo catálogo a partir de uma página CMS.',
      previous: 'Anterior',
      next: 'Próxima',
      pageOf: 'Página {{page}} de {{total}}'
    },
    category: {
      home: 'Início',
      errorTitle: 'Ops! Algo deu errado',
      retry: 'Tentar novamente',
      productsCount: '{{count}} produto{{suffix}}',
      sortBy: 'Ordenar por:',
      previous: 'Anterior',
      next: 'Próxima',
      emptyTitle: 'Nenhum produto encontrado',
      emptyHint: 'Não encontramos produtos nesta categoria no momento.',
      explore: 'Explorar outras categorias',
      stockInStock: 'Em estoque',
      stockLow: 'Apenas {{quantity}} em estoque',
      stockOut: 'Indisponível',
      stockUnknown: 'Consultar'
    },
    orders: {
      account: 'Minha Conta',
      title: 'Meus Pedidos',
      foundCount: '{{count}} pedido{{suffix}} encontrado{{suffix}}',
      loading: 'Carregando seus pedidos...',
      errorTitle: 'Erro ao carregar pedidos',
      retry: 'Tentar novamente',
      results: '{{count}} resultado{{suffix}}',
      sortBy: 'Ordenar por:',
      total: 'Total',
      viewDetails: 'Ver detalhes',
      previous: 'Anterior',
      next: 'Próxima',
      emptyTitle: 'Nenhum pedido encontrado',
      emptyHint: 'Você ainda não fez nenhum pedido.',
      startShopping: 'Começar a comprar',
      sortRecent: 'Mais recentes primeiro',
      sortOldest: 'Mais antigos primeiro',
      sortHighest: 'Maior valor',
      sortLowest: 'Menor valor',
      statusPending: 'Aguardando',
      statusProcessing: 'Em processamento',
      statusReady: 'Pronto para envio',
      statusShipped: 'Enviado',
      statusDelivered: 'Entregue',
      statusCancelled: 'Cancelado',
      statusReturned: 'Devolvido',
      statusRefunded: 'Reembolsado',
      statusOnHold: 'Em espera',
      statusCompleted: 'Concluído',
      statusUnknown: 'Status desconhecido'
    },
    orderDetail: {
      loading: 'Carregando detalhes do pedido...',
      errorTitle: 'Erro ao carregar pedido',
      back: 'Voltar para pedidos',
      retry: 'Tentar novamente',
      eyebrow: 'Detalhes do Pedido',
      orderPlaced: 'Realizado em {{date}}',
      stepOrder: 'Pedido',
      stepProcessing: 'Processamento',
      stepPreparation: 'Preparação',
      stepShipping: 'Envio',
      stepDelivery: 'Entrega',
      itemsTitle: 'Itens do pedido ({{count}})',
      sku: 'SKU',
      quantity: 'Qtd',
      unit: 'un',
      noItems: 'Nenhum item encontrado para este pedido.',
      summary: 'Resumo do pedido',
      subtotal: 'Subtotal',
      shipping: 'Frete',
      taxes: 'Taxas',
      savings: 'Economia',
      total: 'Total',
      address: 'Endereço de entrega',
      postalCode: 'CEP',
      deliveryInfo: 'Informações de entrega',
      mode: 'Modo',
      estimatedDelivery: 'Entrega estimada',
      trackingCode: 'Código de rastreio',
      orderTitle: 'Pedido #',
      statusUnknown: 'Status desconhecido',
      statusPending: 'Aguardando processamento',
      statusProcessing: 'Em processamento',
      statusReady: 'Pronto para envio',
      statusShipped: 'Pedido enviado',
      statusDelivered: 'Pedido entregue',
      statusCancelled: 'Pedido cancelado',
      statusReturned: 'Pedido devolvido',
      statusRefunded: 'Pedido reembolsado',
      statusOnHold: 'Pedido em espera',
      statusCompleted: 'Pedido concluído'
    },
    checkout: {
      secureCheckout: 'Checkout seguro',
      stepAddress: 'Endereço',
      stepDelivery: 'Entrega',
      stepPayment: 'Pagamento',
      stepReview: 'Revisão',
      shippingAddress: 'Endereço de entrega',
      deliveryMethod: 'Método de entrega',
      payment: 'Pagamento',
      reviewOrder: 'Revisar pedido',
      continueToDelivery: 'Continuar para entrega',
      continueToPayment: 'Continuar para pagamento',
      continueToReview: 'Continuar para revisão',
      back: 'Voltar',
      backToPayment: 'Voltar para pagamento',
      initializePayment: 'Inicializar pagamento',
      initializing: 'Inicializando...',
      secureCard: 'Pagamento seguro com cartão via Stripe',
      confirmCard: 'Confirmar pagamento com cartão',
      processing: 'Processando...',
      pixTitle: 'Pagamento Pix',
      pixHint: 'Escaneie o QR code ou copie o código abaixo',
      pixCode: 'Código Pix',
      pixExpires: 'Expira',
      pixCompleted: 'Já concluí o pagamento',
      checking: 'Verificando...',
      reviewAction: 'Revisar pedido',
      reviewing: 'Revisando...',
      reviewHint: 'Conclua o pagamento antes de revisar',
      address: 'Endereço',
      delivery: 'Entrega',
      pricing: 'Preço',
      stock: 'Estoque',
      readyTitle: 'Pronto para finalizar pedido',
      readyHint: 'Todas as validações foram concluídas',
      blockedTitle: 'Revisão bloqueada',
      blockedHint: 'Corrija os problemas acima',
      staleReview: 'A revisão ficou desatualizada. Revise novamente antes de finalizar.',
      placingOrder: 'Finalizando pedido...',
      placeOrder: 'Finalizar pedido',
      terms: 'Ao finalizar o pedido, você concorda com nossos Termos de Serviço e Política de Privacidade',
      emptyCartTitle: 'Seu carrinho está vazio',
      emptyCartHint: 'Adicione produtos para iniciar o checkout',
      goToCart: 'Ir para o carrinho',
      copied: 'Copiado para a área de transferência',
      fullName: 'Nome completo',
      fullNamePlaceholder: 'Maria da Silva',
      phone: 'Telefone',
      phonePlaceholder: '+55 (11) 99999-0000',
      addressLine1: 'Endereço',
      addressLine1Placeholder: 'Rua das Flores, 123',
      addressLine2: 'Complemento',
      addressLine2Placeholder: 'Apto, bloco, etc. (opcional)',
      city: 'Cidade',
      cityPlaceholder: 'São Paulo',
      region: 'Estado / Região',
      regionPlaceholder: 'SP',
      postalCode: 'CEP',
      postalCodePlaceholder: '01001-000',
      country: 'País',
      deliveryNotes: 'Observações de entrega',
      deliveryNotesPlaceholder: 'Deixar na portaria, tocar campainha, etc. (opcional)',
      required: '*',
      fullNameRequired: 'Nome completo é obrigatório',
      addressRequired: 'Endereço é obrigatório',
      cityRequired: 'Cidade é obrigatória',
      postalCodeRequired: 'CEP é obrigatório',
      countryUS: 'Estados Unidos',
      countryBR: 'Brasil',
      countryCA: 'Canadá',
      countryGB: 'Reino Unido',
      countryDE: 'Alemanha',
      countryFR: 'França',
      businessDays: 'dias úteis',
      free: 'Grátis',
      noDeliveryTitle: 'Nenhuma opção de entrega',
      noDeliveryHint: 'Verifique seu endereço e tente novamente.',
      goBack: 'Voltar',
      unavailable: 'Indisponível',
      savingAddress: 'Salvando endereço e carregando opções...',
      savingAddressFailed: 'Falha ao salvar endereço',
      loadingOptionsFailed: 'Falha ao carregar opções do checkout',
      noDeliveryModes: 'Nenhuma opção de entrega disponível para este checkout.',
      noPaymentMethods: 'Nenhum método de pagamento disponível para este checkout.',
      optionsLoaded: 'Opções de entrega e pagamento carregadas. Escolha a entrega e o pagamento e aplique.',
      applyingPayment: 'Aplicando modo de entrega e inicializando pagamento...',
      stripeHint: 'Sessão de cartão segura iniciada. Preencha os dados do cartão e confirme o pagamento antes de revisar.',
      pixPaymentHint: 'Pagamento Pix inicializado. Complete a ação QR/copia-e-cola e aguarde a confirmação antes de revisar.',
      paymentReady: 'Pagamento pronto. Agora você pode revisar o pedido.',
      paymentInitialized: 'Pagamento inicializado. Atualize o status antes de revisar.',
      paymentInitFailed: 'Falha ao inicializar pagamento',
      confirmingCard: 'Confirmando pagamento com Stripe...',
      cardConfirmFailed: 'Falha ao confirmar pagamento com cartão.',
      stripePayloadIncomplete: 'Dados do Stripe incompletos.',
      refreshingPayment: 'Atualizando status do pagamento...',
      cardConfirmed: 'Pagamento confirmado. Atualizando status...',
      refreshPaymentFailed: 'Falha ao atualizar status do pagamento',
      paymentConfirmed: 'Pagamento confirmado. Revise o pedido agora.',
      paymentTerminal: 'Pagamento atingiu estado final.',
      pollPaymentFailed: 'Falha ao consultar status do pagamento',
      pixPending: 'Pagamento Pix aguardando confirmação.',
      paymentRefreshed: 'Status do pagamento atualizado.',
      reviewRefreshing: 'Atualizando revisão do pedido...',
      reviewReady: 'Revisão do pedido concluída.',
      reviewFixes: 'A revisão exige correções.',
      reviewFailed: 'Falha ao revisar o checkout',
      submitting: 'Finalizando pedido...',
      submitFailed: 'Falha ao finalizar pedido',
      deliveryChanged: 'Modo de entrega alterado. Reaplique o pagamento antes de finalizar.',
      stepCompleted: 'Concluído',
      stepSelected: 'Selecionado',
      stepInProgress: 'Em andamento',
      stepReady: 'Pronto',
      softLoginTitle: 'Entre para continuar',
      softLoginMessage: 'Faça login na sua conta para concluir a compra. Seu carrinho será mantido.',
      softLoginSignIn: 'Entrar',
      softLoginContinue: 'Continuar navegando',
      orderSummary: 'Resumo do pedido',
      qty: 'Qtd',
      emptyCartSummary: 'Seu carrinho está vazio',
      subtotal: 'Subtotal',
      total: 'Total',
      days: 'dias',
      readyToPlace: 'Pronto para finalizar',
      reviewRequired: 'Revisão necessária'
    },
    confirmation: {
      confirmedTitle: 'Pedido confirmado!',
      confirmedSubtitle: 'Obrigado pela sua compra',
      processingTitle: 'Processando pedido',
      processingSubtitle: 'Aguarde enquanto concluímos seu pedido',
      notFoundTitle: 'Pedido não encontrado',
      failedTitle: 'Falha no pedido',
      orderStatus: 'Status do pedido',
      checkoutId: 'ID do checkout',
      orderId: 'ID do pedido',
      approvalRequired: 'Aprovação necessária',
      yes: 'Sim',
      no: 'Não',
      created: 'Criado em',
      updated: 'Última atualização',
      retries: 'Tentativas',
      nextTitle: 'O que acontece agora?',
      viewOrderDetails: 'Ver detalhes do pedido',
      orderHistory: 'Histórico de pedidos',
      returnToCart: 'Voltar ao carrinho',
      continueShopping: 'Continuar comprando',
      processingStep1Title: 'Processando seu pedido',
      processingStep1Desc: 'Estamos processando seu pagamento e alocação de estoque. Isso geralmente leva alguns instantes.',
      processingStep2Title: 'Confirmação do pedido',
      processingStep2Desc: 'Você receberá um e-mail de confirmação com os detalhes do pedido.',
      processingStep3Title: 'Envio',
      processingStep3Desc: 'Seu pedido será preparado e enviado para o seu endereço.',
      confirmedStep1Title: 'Pedido confirmado',
      confirmedStep1Desc: 'Seu pedido foi processado e confirmado com sucesso.',
      confirmedStep2Title: 'E-mail de confirmação',
      confirmedStep2Desc: 'Enviamos um e-mail com os detalhes do pedido e informações de rastreio.',
      confirmedStep3Title: 'Acompanhe seu pedido',
      confirmedStep3Desc: 'Você pode acompanhar o status do pedido a qualquer momento pela sua conta.',
      failedStep1Title: 'Pedido não pôde ser concluído',
      failedStep1Desc: 'Encontramos um problema ao processar seu pedido. Seu pagamento não foi cobrado.',
      failedStep2Title: 'Revise e tente novamente',
      failedStep2Desc: 'Por favor, revise seu carrinho e dados de pagamento e tente novamente.',
      notFoundStep1Title: 'Pedido não encontrado',
      notFoundStep1Desc: 'Não encontramos um pedido com o ID informado. Verifique o número do pedido.',
      checkingTitle: 'Verificando status',
      checkingDesc: 'Estamos obtendo as informações do seu pedido. Aguarde...',
      detailConfirmed: 'Pedido confirmado com sucesso.',
      detailFailed: 'Falha no processamento do checkout.',
      detailApproval: 'Checkout enviado e aguardando aprovação.',
      detailProcessing: 'Checkout enviado e ainda em processamento.',
      detailNotFound: 'Confirmação do checkout não encontrada para este ID.',
      detailUnknown: 'Não foi possível carregar a confirmação no momento.'
    },
    pdp: {
      loading: 'Carregando produto...',
      errorTitle: 'Erro ao carregar produto',
      goBack: '← Voltar',
      retry: 'Tentar novamente',
      home: 'Home',
      zoomHint: '🔍 Passe o mouse para zoom',
      reviews: '({{count}} avaliações)',
      quantity: 'Quantidade:',
      adding: 'Adicionando...',
      addToCart: 'Adicionar ao Carrinho',
      unavailable: 'Indisponível',
      wishlistTitle: 'Adicionar à lista de desejos',
      freeShipping: 'Frete grátis disponível',
      tabDescription: 'Descrição',
      tabSpecifications: 'Especificações',
      tabReviews: 'Avaliações',
      relatedProducts: 'Produtos Relacionados',
      stockInStock: '✓ Em estoque',
      stockLow: '⚠️ Apenas {{quantity}} em estoque',
      stockOut: '✗ Indisponível',
      stockUnknown: 'Consultar disponibilidade',
      addToCartError: 'Erro ao adicionar ao carrinho. Tente novamente.'
    },
    productCard: {
      badgeNew: 'Novo',
      badgeTop: 'Top',
      badgeSale: '{{percentage}}% OFF',
      badgeLimited: 'Últimas',
      stockInStock: '✓ Em estoque',
      stockLow: '⚠️ Apenas {{quantity}} un.',
      stockOut: '✗ Esgotado',
      stockUnknown: 'Consultar',
      quickAddUnavailable: 'Indisponível',
      quickAddToCart: 'Adicionar ao carrinho'
    },
    normalizer: {
      sortRelevance: 'Relevância',
      sortNameAsc: 'Nome (A-Z)',
      sortNameDesc: 'Nome (Z-A)',
      sortPriceAsc: 'Menor Preço',
      sortPriceDesc: 'Maior Preço',
      sortNewest: 'Mais Recentes',
      availInStock: 'Em estoque ({{quantity}} disponíveis)',
      availInStockSimple: 'Em estoque',
      availLowStock: 'Apenas {{quantity}} em estoque',
      availLowStockSimple: 'Estoque baixo',
      availOutOfStock: 'Fora de estoque',
      availUnknown: 'Consultar disponibilidade',
      deliveryInStock: 'Entrega em 2-5 dias úteis',
      deliveryLowStock: 'Entrega em 3-7 dias úteis',
      deliveryOutOfStock: 'Produto indisponível',
      deliveryUnknown: 'Consultar prazo de entrega'
    },
    productService: {
      variantUnavailable: 'Variante indisponível',
      combinationUnavailable: 'Combinação não disponível',
      unknownError: 'Erro desconhecido'
    },
    fallback: {
      errorTitle: 'Erro ao Carregar Conteúdo',
      errorHint: 'Não foi possível carregar este conteúdo. Tente atualizar a página ou volte mais tarde.',
      retry: 'Tentar Novamente',
      loading: 'Carregando conteúdo...',
      notFoundTitle: 'Página Não Encontrada',
      notFoundMessage: 'A página que você está procurando não existe ou foi movida.',
      backToHome: 'Voltar para Home',
      goBack: 'Voltar'
    },
    formBlock: {
      selectPlaceholder: 'Selecione...',
      submitting: 'Enviando...',
      submitDefault: 'Enviar',
      successMessage: 'Formulário enviado com sucesso!',
      errorMessage: 'Erro ao enviar formulário. Tente novamente.'
    },
    http: {
      connectionLost: 'Conexão interrompida. Verifique sua internet.',
      sessionExpired: 'Sua sessão expirou. Faça login novamente.',
      forbidden: 'Você não tem permissão para realizar esta ação.',
      notFound: 'O recurso solicitado não foi encontrado.',
      serverError: 'Ocorreu um erro no servidor. Tente novamente em instantes.'
    },
    pageRenderer: {
      notFoundTitle: 'Página não encontrada',
      notFoundMessage: 'A página solicitada não existe ou não está publicada.',
      loading: 'Carregando página...'
    },
    categories: {
      electronics: 'Eletrônicos',
      fashion: 'Moda',
      home: 'Casa & Decoração',
      sports: 'Esportes',
      beauty: 'Beleza'
    },
    reviews: {
      title: 'Avaliações dos clientes',
      noReviews: 'Ainda não há avaliações.',
      beFirst: 'Seja o primeiro a avaliar este produto.',
      averageRating: 'Avaliação média',
      outOf: 'de 5',
      writeReview: 'Escrever avaliação',
      yourRating: 'Sua avaliação',
      titleLabel: 'Título',
      titlePlaceholder: 'Resumo da sua avaliação',
      bodyLabel: 'Comentário',
      bodyPlaceholder: 'Descreva sua experiência com o produto...',
      submit: 'Enviar avaliação',
      submitting: 'Enviando...',
      loginToReview: 'Faça login para avaliar este produto.',
      alreadyReviewed: 'Você já avaliou este produto.',
      editReview: 'Editar avaliação',
      successMessage: 'Avaliação enviada com sucesso!',
      errorMessage: 'Não foi possível enviar a avaliação. Tente novamente.'
    },
    wishlist: {
      title: 'Minha Lista de Desejos',
      empty: 'Sua lista de desejos está vazia.',
      emptyHint: 'Adicione produtos à sua lista de desejos para salvá-los.',
      add: 'Adicionar à lista de desejos',
      remove: 'Remover da lista de desejos',
      saved: 'Salvo na lista de desejos',
      loginRequired: 'Faça login para usar a lista de desejos.',
      viewWishlist: 'Ver lista de desejos',
      addToCart: 'Adicionar ao carrinho',
      removeItem: 'Remover',
      browseCatalog: 'Explorar catálogo'
    }
  },
  'en-US': {
    login: {
      subtitle: 'Access your account',
      username: 'Username',
      password: 'Password',
      signIn: 'Sign in',
      signingIn: 'Signing in...',
      noAccount: 'Don\'t have an account?',
      createAccount: 'Sign up',
      invalidCredentials: 'Invalid username or password.',
      cartPromotionWarning: 'Login completed, but we could not recover your previous cart.',
      usernameRequired: 'Username is required',
      passwordRequired: 'Password is required'
    },
    register: {
      subtitle: 'Create your account',
      email: 'Email',
      emailPlaceholder: 'you@example.com',
      password: 'Password',
      passwordPlaceholder: 'At least 8 characters',
      confirmPassword: 'Confirm password',
      confirmPasswordPlaceholder: 'Repeat your password',
      createAccount: 'Create account',
      creating: 'Creating...',
      hasAccount: 'Already have an account?',
      signIn: 'Sign in',
      emailRequired: 'Email is required',
      emailInvalid: 'Invalid email address',
      passwordRequired: 'Password is required',
      passwordMinLength: 'At least 8 characters',
      passwordMismatch: 'Passwords do not match',
      emailConflict: 'This email is already registered.',
      genericError: 'Could not create account. Please try again.'
    },
    cart: {
      empty: {
        title: 'Your cart is empty',
        description: 'You haven\'t added any products yet.',
        browseCatalog: 'Browse catalog'
      },
      title: 'Your Cart',
      eyebrow: 'Shopping Cart',
      item: 'item',
      items: 'items',
      each: 'each',
      removeItem: 'Remove item',
      proceedToCheckout: 'Proceed to Checkout',
      continueShopping: 'Continue Shopping',
      orderSummary: 'Order Summary',
      subtotal: 'Subtotal',
      discounts: 'Discounts',
      estimatedTax: 'Estimated Tax',
      estimatedTotal: 'Estimated Total',
      secureNote: 'Secure checkout. Your data is protected.'
    },
    header: {
      promo: 'Free shipping on orders over $199 | 10% OFF on your first purchase',
      menu: 'Menu',
      searchPlaceholder: 'What are you looking for?',
      searchAria: 'Search products',
      account: 'My Account',
      signIn: 'Sign in',
      register: 'Sign up',
      logout: 'Sign out',
      cart: 'Cart',
      sale: 'Deals',
      locale: 'Language'
    },
    footer: {
      newsletterTitle: 'Stay on top of new arrivals',
      newsletterText: 'Sign up to receive exclusive offers and product updates',
      newsletterPlaceholder: 'Your best email',
      newsletterButton: 'Subscribe',
      newsletterSuccess: 'Successfully subscribed!',
      newsletterError: 'Could not subscribe. Please try again.',
      tagline: 'Your trusted online store. Great products with fast delivery.',
      shop: 'Shop',
      help: 'Help',
      company: 'Company',
      contact: 'Contact',
      support24h: '24/7 support',
      rights: 'All rights reserved.',
      privacy: 'Privacy',
      terms: 'Terms',
      cookies: 'Cookies'
    },
    commerce: {
      viewProduct: 'View product',
      addToCart: 'Add to cart',
      browseCategory: 'Browse category',
      cmsGridEmpty: 'No products were found for this CMS block.',
      cmsGridViewAll: 'View all'
    },
    search: {
      eyebrow: 'Search',
      resultsFor: 'Results for "{{query}}"',
      searchCatalog: 'Search catalog',
      productsCount: '{{count}} products',
      noProducts: 'No products found',
      noProductsHint: 'Try another query or browse the catalog from a CMS page.',
      previous: 'Previous',
      next: 'Next',
      pageOf: 'Page {{page}} of {{total}}'
    },
    category: {
      home: 'Home',
      errorTitle: 'Something went wrong',
      retry: 'Try again',
      productsCount: '{{count}} product{{suffix}}',
      sortBy: 'Sort by:',
      previous: 'Previous',
      next: 'Next',
      emptyTitle: 'No products found',
      emptyHint: 'No products are currently available in this category.',
      explore: 'Explore other categories',
      stockInStock: 'In stock',
      stockLow: 'Only {{quantity}} left',
      stockOut: 'Unavailable',
      stockUnknown: 'Check availability'
    },
    orders: {
      account: 'My Account',
      title: 'My Orders',
      foundCount: '{{count}} order{{suffix}} found',
      loading: 'Loading your orders...',
      errorTitle: 'Could not load orders',
      retry: 'Try again',
      results: '{{count}} result{{suffix}}',
      sortBy: 'Sort by:',
      total: 'Total',
      viewDetails: 'View details',
      previous: 'Previous',
      next: 'Next',
      emptyTitle: 'No orders found',
      emptyHint: 'You have not placed any orders yet.',
      startShopping: 'Start shopping',
      sortRecent: 'Most recent first',
      sortOldest: 'Oldest first',
      sortHighest: 'Highest total',
      sortLowest: 'Lowest total',
      statusPending: 'Pending',
      statusProcessing: 'Processing',
      statusReady: 'Ready to ship',
      statusShipped: 'Shipped',
      statusDelivered: 'Delivered',
      statusCancelled: 'Cancelled',
      statusReturned: 'Returned',
      statusRefunded: 'Refunded',
      statusOnHold: 'On hold',
      statusCompleted: 'Completed',
      statusUnknown: 'Unknown status'
    },
    orderDetail: {
      loading: 'Loading order details...',
      errorTitle: 'Could not load order',
      back: 'Back to orders',
      retry: 'Try again',
      eyebrow: 'Order Details',
      orderPlaced: 'Placed on {{date}}',
      stepOrder: 'Order',
      stepProcessing: 'Processing',
      stepPreparation: 'Preparation',
      stepShipping: 'Shipping',
      stepDelivery: 'Delivery',
      itemsTitle: 'Order items ({{count}})',
      sku: 'SKU',
      quantity: 'Qty',
      unit: 'ea',
      noItems: 'No items were found for this order.',
      summary: 'Order summary',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      taxes: 'Taxes',
      savings: 'Savings',
      total: 'Total',
      address: 'Delivery address',
      postalCode: 'Postal code',
      deliveryInfo: 'Delivery information',
      mode: 'Mode',
      estimatedDelivery: 'Estimated delivery',
      trackingCode: 'Tracking code',
      orderTitle: 'Order #',
      statusUnknown: 'Unknown status',
      statusPending: 'Awaiting processing',
      statusProcessing: 'Processing',
      statusReady: 'Ready to ship',
      statusShipped: 'Shipped',
      statusDelivered: 'Delivered',
      statusCancelled: 'Cancelled',
      statusReturned: 'Returned',
      statusRefunded: 'Refunded',
      statusOnHold: 'On hold',
      statusCompleted: 'Completed'
    },
    checkout: {
      secureCheckout: 'Secure Checkout',
      stepAddress: 'Address',
      stepDelivery: 'Delivery',
      stepPayment: 'Payment',
      stepReview: 'Review',
      shippingAddress: 'Shipping Address',
      deliveryMethod: 'Delivery Method',
      payment: 'Payment',
      reviewOrder: 'Review Order',
      continueToDelivery: 'Continue to Delivery',
      continueToPayment: 'Continue to Payment',
      continueToReview: 'Continue to Review',
      back: 'Back',
      backToPayment: 'Back to Payment',
      initializePayment: 'Initialize Payment',
      initializing: 'Initializing...',
      secureCard: 'Secure card payment powered by Stripe',
      confirmCard: 'Confirm Card Payment',
      processing: 'Processing...',
      pixTitle: 'Pix Payment',
      pixHint: 'Scan the QR code or copy the code below',
      pixCode: 'Pix Code',
      pixExpires: 'Expires',
      pixCompleted: 'I have completed the payment',
      checking: 'Checking...',
      reviewAction: 'Review Order',
      reviewing: 'Reviewing...',
      reviewHint: 'Complete payment before reviewing',
      address: 'Address',
      delivery: 'Delivery',
      pricing: 'Pricing',
      stock: 'Stock',
      readyTitle: 'Ready to place order',
      readyHint: 'All validations passed',
      blockedTitle: 'Review blocked',
      blockedHint: 'Please fix the issues above',
      staleReview: 'Review is stale. Please review again before placing order.',
      placingOrder: 'Placing Order...',
      placeOrder: 'Place Order',
      terms: 'By placing your order, you agree to our Terms of Service and Privacy Policy',
      emptyCartTitle: 'Your cart is empty',
      emptyCartHint: 'Add some products to start checkout',
      goToCart: 'Go to Cart',
      copied: 'Copied to clipboard',
      fullName: 'Full name',
      fullNamePlaceholder: 'John Doe',
      phone: 'Phone',
      phonePlaceholder: '+1 (555) 000-0000',
      addressLine1: 'Address line 1',
      addressLine1Placeholder: '123 Main Street',
      addressLine2: 'Address line 2',
      addressLine2Placeholder: 'Apt, suite, unit, etc. (optional)',
      city: 'City',
      cityPlaceholder: 'New York',
      region: 'State / Region',
      regionPlaceholder: 'NY',
      postalCode: 'Postal code',
      postalCodePlaceholder: '10001',
      country: 'Country',
      deliveryNotes: 'Delivery notes',
      deliveryNotesPlaceholder: 'Leave at door, ring bell, etc. (optional)',
      required: '*',
      fullNameRequired: 'Full name is required',
      addressRequired: 'Address is required',
      cityRequired: 'City is required',
      postalCodeRequired: 'Postal code is required',
      countryUS: 'United States',
      countryBR: 'Brazil',
      countryCA: 'Canada',
      countryGB: 'United Kingdom',
      countryDE: 'Germany',
      countryFR: 'France',
      businessDays: 'business days',
      free: 'Free',
      noDeliveryTitle: 'No delivery options',
      noDeliveryHint: 'Please check your address and try again.',
      goBack: 'Go back',
      unavailable: 'Unavailable',
      savingAddress: 'Saving address and loading checkout options...',
      savingAddressFailed: 'Saving checkout address failed',
      loadingOptionsFailed: 'Loading checkout options failed',
      noDeliveryModes: 'No delivery modes are currently available for this checkout.',
      noPaymentMethods: 'No payment methods are currently available for this checkout.',
      optionsLoaded: 'Delivery and payment options loaded. Choose delivery and payment method and apply.',
      applyingPayment: 'Applying delivery mode and initializing payment...',
      stripeHint: 'Secure card session initialized. Enter card details and confirm payment before reviewing.',
      pixPaymentHint: 'Pix payment initialized. Complete the QR/copy-and-paste action and wait for confirmation before reviewing.',
      paymentReady: 'Payment is ready. You can review the order now.',
      paymentInitialized: 'Payment initialized. Refresh the payment status before reviewing.',
      paymentInitFailed: 'Initializing payment failed',
      confirmingCard: 'Confirming card payment with Stripe...',
      cardConfirmFailed: 'Card payment confirmation failed.',
      stripePayloadIncomplete: 'Stripe card client payload is incomplete.',
      refreshingPayment: 'Refreshing payment status...',
      cardConfirmed: 'Card payment confirmed. Refreshing payment status...',
      refreshPaymentFailed: 'Refreshing payment status failed',
      paymentConfirmed: 'Payment confirmed. Review the order now.',
      paymentTerminal: 'Payment reached a terminal state.',
      pollPaymentFailed: 'Polling payment status failed',
      pixPending: 'Pix payment is still pending customer confirmation.',
      paymentRefreshed: 'Payment status refreshed.',
      reviewRefreshing: 'Refreshing payment state and checkout review...',
      reviewReady: 'Checkout review is ready.',
      reviewFixes: 'Checkout review requires fixes.',
      reviewFailed: 'Refreshing checkout review failed',
      submitting: 'Submitting checkout...',
      submitFailed: 'Checkout failed',
      deliveryChanged: 'Delivery mode changed. Re-apply payment before placing order.',
      stepCompleted: 'Completed',
      stepSelected: 'Selected',
      stepInProgress: 'In progress',
      stepReady: 'Ready',
      softLoginTitle: 'Sign in to continue',
      softLoginMessage: 'Please sign in to your account to complete your purchase. Your cart will be saved.',
      softLoginSignIn: 'Sign In',
      softLoginContinue: 'Continue Browsing',
      orderSummary: 'Order Summary',
      qty: 'Qty',
      emptyCartSummary: 'Your cart is empty',
      subtotal: 'Subtotal',
      total: 'Total',
      days: 'days',
      readyToPlace: 'Ready to place order',
      reviewRequired: 'Review required'
    },
    confirmation: {
      confirmedTitle: 'Order Confirmed!',
      confirmedSubtitle: 'Thank you for your purchase',
      processingTitle: 'Processing Order',
      processingSubtitle: 'Please wait while we complete your order',
      notFoundTitle: 'Order Not Found',
      failedTitle: 'Order Failed',
      orderStatus: 'Order Status',
      checkoutId: 'Checkout ID',
      orderId: 'Order ID',
      approvalRequired: 'Approval Required',
      yes: 'Yes',
      no: 'No',
      created: 'Created',
      updated: 'Last Update',
      retries: 'Retry Attempts',
      nextTitle: 'What happens next?',
      viewOrderDetails: 'View Order Details',
      orderHistory: 'Order History',
      returnToCart: 'Return to Cart',
      continueShopping: 'Continue Shopping',
      processingStep1Title: 'Processing your order',
      processingStep1Desc: 'We\'re securely processing your payment and inventory allocation. This usually takes a few moments.',
      processingStep2Title: 'Order confirmation',
      processingStep2Desc: 'You\'ll receive a confirmation email with your order details.',
      processingStep3Title: 'Shipping',
      processingStep3Desc: 'Your order will be prepared and shipped to your address.',
      confirmedStep1Title: 'Order confirmed',
      confirmedStep1Desc: 'Your order has been successfully processed and confirmed.',
      confirmedStep2Title: 'Confirmation email',
      confirmedStep2Desc: 'We\'ve sent a confirmation email with your order details and tracking information.',
      confirmedStep3Title: 'Track your order',
      confirmedStep3Desc: 'You can track your order status anytime from your account.',
      failedStep1Title: 'Order could not be completed',
      failedStep1Desc: 'We encountered an issue processing your order. Your payment has not been charged.',
      failedStep2Title: 'Review and try again',
      failedStep2Desc: 'Please review your cart and payment information, then try again.',
      notFoundStep1Title: 'Order not found',
      notFoundStep1Desc: 'We couldn\'t find an order with the provided ID. Please check your order number.',
      checkingTitle: 'Checking status',
      checkingDesc: 'We\'re retrieving your order information. Please wait...',
      detailConfirmed: 'Order confirmed successfully.',
      detailFailed: 'Checkout failed during processing.',
      detailApproval: 'Checkout submitted and waiting for approval before order completion.',
      detailProcessing: 'Checkout submitted and still being processed.',
      detailNotFound: 'Checkout confirmation was not found for this checkout id.',
      detailUnknown: 'Unable to load checkout confirmation right now.'
    },
    pdp: {
      loading: 'Loading product...',
      errorTitle: 'Error loading product',
      goBack: '← Back',
      retry: 'Try again',
      home: 'Home',
      zoomHint: '🔍 Hover to zoom',
      reviews: '({{count}} reviews)',
      quantity: 'Quantity:',
      adding: 'Adding...',
      addToCart: 'Add to Cart',
      unavailable: 'Unavailable',
      wishlistTitle: 'Add to wishlist',
      freeShipping: 'Free shipping available',
      tabDescription: 'Description',
      tabSpecifications: 'Specifications',
      tabReviews: 'Reviews',
      relatedProducts: 'Related Products',
      stockInStock: '✓ In stock',
      stockLow: '⚠️ Only {{quantity}} in stock',
      stockOut: '✗ Unavailable',
      stockUnknown: 'Check availability',
      addToCartError: 'Error adding to cart. Please try again.'
    },
    productCard: {
      badgeNew: 'New',
      badgeTop: 'Top',
      badgeSale: '{{percentage}}% OFF',
      badgeLimited: 'Last units',
      stockInStock: '✓ In stock',
      stockLow: '⚠️ Only {{quantity}} left',
      stockOut: '✗ Sold out',
      stockUnknown: 'Check',
      quickAddUnavailable: 'Unavailable',
      quickAddToCart: 'Add to cart'
    },
    normalizer: {
      sortRelevance: 'Relevance',
      sortNameAsc: 'Name (A-Z)',
      sortNameDesc: 'Name (Z-A)',
      sortPriceAsc: 'Lowest Price',
      sortPriceDesc: 'Highest Price',
      sortNewest: 'Newest',
      availInStock: 'In stock ({{quantity}} available)',
      availInStockSimple: 'In stock',
      availLowStock: 'Only {{quantity}} in stock',
      availLowStockSimple: 'Low stock',
      availOutOfStock: 'Out of stock',
      availUnknown: 'Check availability',
      deliveryInStock: 'Delivery in 2-5 business days',
      deliveryLowStock: 'Delivery in 3-7 business days',
      deliveryOutOfStock: 'Product unavailable',
      deliveryUnknown: 'Check delivery time'
    },
    productService: {
      variantUnavailable: 'Variant unavailable',
      combinationUnavailable: 'Combination not available',
      unknownError: 'Unknown error'
    },
    fallback: {
      errorTitle: 'Failed to Load Content',
      errorHint: 'This content could not be loaded. Try refreshing the page or come back later.',
      retry: 'Try Again',
      loading: 'Loading content...',
      notFoundTitle: 'Page Not Found',
      notFoundMessage: 'The page you are looking for does not exist or has been moved.',
      backToHome: 'Back to Home',
      goBack: 'Go Back'
    },
    formBlock: {
      selectPlaceholder: 'Select...',
      submitting: 'Submitting...',
      submitDefault: 'Submit',
      successMessage: 'Form submitted successfully!',
      errorMessage: 'Error submitting form. Please try again.'
    },
    http: {
      connectionLost: 'Connection lost. Please check your internet.',
      sessionExpired: 'Your session has expired. Please sign in again.',
      forbidden: 'You do not have permission to perform this action.',
      notFound: 'The requested resource was not found.',
      serverError: 'A server error occurred. Please try again shortly.'
    },
    pageRenderer: {
      notFoundTitle: 'Page not found',
      notFoundMessage: 'The requested page does not exist or is not published.',
      loading: 'Loading page...'
    },
    categories: {
      electronics: 'Electronics',
      fashion: 'Fashion',
      home: 'Home & Decor',
      sports: 'Sports',
      beauty: 'Beauty'
    },
    reviews: {
      title: 'Customer Reviews',
      noReviews: 'No reviews yet.',
      beFirst: 'Be the first to review this product.',
      averageRating: 'Average rating',
      outOf: 'out of 5',
      writeReview: 'Write a review',
      yourRating: 'Your rating',
      titleLabel: 'Title',
      titlePlaceholder: 'Summarize your review',
      bodyLabel: 'Review',
      bodyPlaceholder: 'Describe your experience with this product...',
      submit: 'Submit review',
      submitting: 'Submitting...',
      loginToReview: 'Sign in to review this product.',
      alreadyReviewed: 'You have already reviewed this product.',
      editReview: 'Edit review',
      successMessage: 'Review submitted successfully!',
      errorMessage: 'Could not submit review. Please try again.'
    },
    wishlist: {
      title: 'My Wishlist',
      empty: 'Your wishlist is empty.',
      emptyHint: 'Add products to your wishlist to save them.',
      add: 'Add to wishlist',
      remove: 'Remove from wishlist',
      saved: 'Saved to wishlist',
      loginRequired: 'Sign in to use the wishlist.',
      viewWishlist: 'View wishlist',
      addToCart: 'Add to cart',
      removeItem: 'Remove',
      browseCatalog: 'Browse catalog'
    }
  }
};

@Injectable({ providedIn: 'root' })
export class JuliI18nService {
  private readonly supportedLocales = environment.supportedLocales as JuliLocaleConfig[];
  private readonly defaultLocale = this.normalizeLocale(environment.defaultLocale);
  private readonly fallbackLocale = this.normalizeLocale(environment.fallbackLocale);
  private readonly localeSubject = new BehaviorSubject<string>(this.resolveInitialLocale());

  readonly locale$: Observable<string> = this.localeSubject.asObservable().pipe(distinctUntilChanged());
  readonly activeLocale$: Observable<JuliLocaleConfig> = this.locale$.pipe(
    map(locale => this.getLocaleConfig(locale))
  );

  initialize(): void {
    const locale = this.resolveInitialLocale();
    this.applyDomLocale(locale);
    this.localeSubject.next(locale);
  }

  get currentLocale(): string {
    return this.localeSubject.value;
  }

  get currentCurrency(): string {
    return this.getLocaleConfig(this.localeSubject.value).currency;
  }

  get fallback(): string {
    return this.fallbackLocale;
  }

  get locales(): JuliLocaleConfig[] {
    return this.supportedLocales;
  }

  setLocale(locale: string): void {
    const normalized = this.normalizeLocale(locale);
    if (normalized === this.localeSubject.value) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // Ignore storage access issues in restricted browsers.
    }
    this.applyDomLocale(normalized);
    this.localeSubject.next(normalized);
  }

  translate(key: string, params?: Record<string, string | number | undefined>, locale: string = this.currentLocale): string {
    const value = this.resolveTranslation(locale, key) ?? this.resolveTranslation(this.fallbackLocale, key) ?? key;
    if (!params) {
      return value;
    }
    return Object.entries(params).reduce(
      (message, [paramKey, paramValue]) => message.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, 'g'), String(paramValue ?? '')),
      value
    );
  }

  private resolveTranslation(locale: string, key: string): string | undefined {
    const tree = TRANSLATIONS[this.normalizeLocale(locale)] ?? TRANSLATIONS[this.fallbackLocale];
    const resolved = key.split('.').reduce<string | TranslationTree | undefined>((current, segment) => {
      if (!current || typeof current === 'string') {
        return current;
      }
      return current[segment];
    }, tree);
    return typeof resolved === 'string' ? resolved : undefined;
  }

  private resolveInitialLocale(): string {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return this.normalizeLocale(stored);
      }
    } catch {
      // Ignore storage access issues in restricted browsers.
    }

    const browserLocale = typeof navigator !== 'undefined' ? navigator.language : this.defaultLocale;
    return this.normalizeLocale(browserLocale);
  }

  private normalizeLocale(locale: string | null | undefined): string {
    const raw = (locale ?? '').trim();
    const match = this.supportedLocales.find(entry =>
      entry.code.toLowerCase() === raw.toLowerCase() || entry.language.toLowerCase() === raw.toLowerCase()
    );
    return match?.code ?? environment.defaultLocale;
  }

  private getLocaleConfig(locale: string): JuliLocaleConfig {
    return this.supportedLocales.find(entry => entry.code === this.normalizeLocale(locale)) ?? this.supportedLocales[0];
  }

  private applyDomLocale(locale: string): void {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }
}

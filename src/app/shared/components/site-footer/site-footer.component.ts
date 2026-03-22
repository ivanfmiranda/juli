/**
 * Site Footer Component
 * 
 * Footer comercial premium do JULI.
 */

import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.component.html',
  styleUrls: ['./site-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteFooterComponent {
  readonly currentYear = new Date().getFullYear();
  
  readonly footerLinks = {
    shop: [
      { name: 'Eletrônicos', url: '/c/eletronicos' },
      { name: 'Moda', url: '/c/moda' },
      { name: 'Casa & Decoração', url: '/c/casa' },
      { name: 'Promoções', url: '/c/promocoes' },
    ],
    support: [
      { name: 'Central de Ajuda', url: '/page/ajuda' },
      { name: 'Trocas e Devoluções', url: '/page/trocas' },
      { name: 'Entregas', url: '/page/entregas' },
      { name: 'Pagamentos', url: '/page/pagamentos' },
    ],
    company: [
      { name: 'Sobre a JULI', url: '/page/sobre' },
      { name: 'Trabalhe Conosco', url: '/page/carreiras' },
      { name: 'Seja um Parceiro', url: '/page/parceiros' },
      { name: 'Blog', url: '/page/blog' },
    ],
  };

  readonly paymentMethods = ['💳 Visa', '💳 Mastercard', '💳 Amex', '💳 Elo', '📱 Pix', '💰 Boleto'];
  
  readonly socialLinks = [
    { name: 'Instagram', icon: '📷', url: '#' },
    { name: 'Facebook', icon: '👍', url: '#' },
    { name: 'Twitter', icon: '🐦', url: '#' },
    { name: 'YouTube', icon: '▶️', url: '#' },
  ];
}

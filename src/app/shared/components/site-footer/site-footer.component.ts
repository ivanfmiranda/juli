/**
 * Site Footer Component
 * 
 * Footer comercial premium do JULI.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { JuliI18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.component.html',
  styleUrls: ['./site-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteFooterComponent {
  readonly currentYear = new Date().getFullYear();

  newsletterEmail = '';
  newsletterSubmitting = false;
  newsletterSuccess = false;
  newsletterError = false;
  
  readonly footerLinks = {
    shop: [
      { name: 'categories.electronics', url: '/c/eletronicos' },
      { name: 'categories.fashion', url: '/c/moda' },
      { name: 'categories.home', url: '/c/casa' },
      { name: 'header.sale', url: '/c/promocoes' },
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

  constructor(
    public readonly i18n: JuliI18nService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  subscribeNewsletter(): void {
    const email = this.newsletterEmail.trim();
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email)) {
      return;
    }
    this.newsletterSubmitting = true;
    this.newsletterSuccess = false;
    this.newsletterError = false;
    this.cdr.markForCheck();

    // Simulate async submission — replace with real API call when available
    setTimeout(() => {
      this.newsletterSubmitting = false;
      this.newsletterSuccess = true;
      this.newsletterEmail = '';
      this.cdr.markForCheck();
    }, 800);
  }
}

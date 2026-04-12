/**
 * Site Footer Component
 *
 * Footer comercial premium do JULI.
 * Links and branding are fetched from the tenant-branding API.
 */

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { JuliI18nService } from '../../../core/i18n/i18n.service';
import { TenantBrandingApiService, FooterLinkSet } from '../../../core/services/tenant-branding-api.service';

@Component({
  selector: 'app-site-footer',
  templateUrl: './site-footer.component.html',
  styleUrls: ['./site-footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SiteFooterComponent implements OnInit, OnDestroy {
  readonly currentYear = new Date().getFullYear();

  brandName = 'JULI';
  brandIcon = '🛍️';
  logoUrl: string | null = null;

  newsletterEmail = '';
  newsletterSubmitting = false;
  newsletterSuccess = false;
  newsletterError = false;

  footerLinks: FooterLinkSet = {
    shop: [],
    support: [],
    company: [],
  };

  readonly paymentMethods = ['💳 Visa', '💳 Mastercard', '💳 Elo', '📱 Pix'];

  readonly socialLinks = [
    { name: 'Instagram', icon: '📷', url: '#' },
    { name: 'Facebook', icon: '👍', url: '#' },
    { name: 'YouTube', icon: '▶️', url: '#' },
  ];

  private readonly destroy$ = new Subject<void>();

  constructor(
    public readonly i18n: JuliI18nService,
    private readonly cdr: ChangeDetectorRef,
    private readonly brandingApi: TenantBrandingApiService,
  ) {}

  ngOnInit(): void {
    this.brandingApi.config$.pipe(takeUntil(this.destroy$)).subscribe(config => {
      this.brandName = config.brandName;
      this.brandIcon = config.brandIcon;
      this.logoUrl = config.logoUrl;
      this.footerLinks = config.footerLinks;
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

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

    setTimeout(() => {
      this.newsletterSubmitting = false;
      this.newsletterSuccess = true;
      this.newsletterEmail = '';
      this.cdr.markForCheck();
    }, 800);
  }
}

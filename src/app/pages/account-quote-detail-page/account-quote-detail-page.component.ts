import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { JuliQuoteService } from '../../core/commerce/services/juli-quote.service';

@Component({
  selector: 'app-account-quote-detail-page',
  templateUrl: './account-quote-detail-page.component.html',
  styleUrls: ['./account-quote-detail-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountQuoteDetailPageComponent implements OnInit {
  quote: Record<string, any> | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly quoteService: JuliQuoteService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.error = 'ID de cotação ausente.';
      return;
    }
    this.quoteService.get(id).subscribe({
      next: data => {
        this.quote = data as Record<string, any>;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.error = (err?.error?.message || err?.message) ?? 'Falha ao carregar cotação.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  itemTotal(item: Record<string, any>): number {
    const qty = Number(item?.quantity ?? 0);
    const price = Number(item?.unitPrice ?? 0);
    return qty * price;
  }

  /**
   * Build a buyer-friendly timeline from the quote's lifecycle timestamps.
   * The detailed approval steps (which level / which role / who decided)
   * sit behind {@code requireApprover(jwt)} on b2b-platform, so a regular
   * buyer cannot see them — what they DO see is the chain: created →
   * submitted → approved/rejected → converted to order. Each entry
   * surfaces only when its timestamp is present, so DRAFT quotes show
   * just "Created" and APPROVED ones expand fully.
   */
  timeline(): Array<{ label: string; at?: string; state: 'done' | 'current' | 'failed' }> {
    if (!this.quote) return [];
    const status = String(this.quote['status'] || '').toUpperCase();
    const submittedAt = this.quote['submittedAt'];
    const decidedAt = this.quote['decidedAt'];
    const convertedAt = this.quote['convertedAt'];
    const isRejected = status === 'REJECTED';
    const isApproved = status === 'APPROVED' || status === 'CONVERTED';
    const isPending = status === 'PENDING_APPROVAL';

    const out: Array<{ label: string; at?: string; state: 'done' | 'current' | 'failed' }> = [];
    out.push({ label: 'Cotação aberta', at: this.quote['createdAt'], state: 'done' });
    if (submittedAt || isPending || isApproved || isRejected) {
      out.push({ label: 'Enviada para aprovação', at: submittedAt, state: 'done' });
    }
    if (isPending) {
      out.push({ label: 'Aguardando aprovador', state: 'current' });
    } else if (isApproved) {
      out.push({ label: 'Aprovada', at: decidedAt, state: 'done' });
    } else if (isRejected) {
      out.push({ label: 'Rejeitada', at: decidedAt, state: 'failed' });
    }
    if (convertedAt) {
      out.push({ label: 'Convertida em pedido', at: convertedAt, state: 'done' });
    }
    return out;
  }
}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApprovalRequestRow, JuliApprovalsInboxService } from '../../core/commerce/services/juli-approvals-inbox.service';

@Component({
  selector: 'app-account-approvals-inbox-page',
  templateUrl: './account-approvals-inbox-page.component.html',
  styleUrls: ['./account-approvals-inbox-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountApprovalsInboxPageComponent implements OnInit {
  rows: ApprovalRequestRow[] = [];
  loading = true;
  error: string | null = null;
  acting: Record<string, 'approve' | 'reject' | undefined> = {};
  flash: { kind: 'ok' | 'err'; text: string } | null = null;

  constructor(
    private readonly service: JuliApprovalsInboxService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    this.error = null;
    this.cdr.markForCheck();
    this.service.pending().subscribe({
      next: list => {
        this.rows = list;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: err => {
        this.error = (err?.error?.message || err?.message) ?? 'Falha ao carregar aprovações.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  approve(row: ApprovalRequestRow): void {
    if (!row.checkoutId || this.acting[row.checkoutId]) return;
    this.acting[row.checkoutId] = 'approve';
    this.cdr.markForCheck();
    this.service.approve(row.checkoutId).subscribe({
      next: () => {
        this.acting[row.checkoutId] = undefined;
        this.flash = { kind: 'ok', text: 'Aprovação registrada.' };
        this.refresh();
      },
      error: err => {
        this.acting[row.checkoutId] = undefined;
        this.flash = { kind: 'err', text: (err?.error?.message || err?.message) ?? 'Falha ao aprovar.' };
        this.cdr.markForCheck();
      }
    });
  }

  reject(row: ApprovalRequestRow): void {
    if (!row.checkoutId || this.acting[row.checkoutId]) return;
    const reason = window.prompt('Motivo da rejeição (opcional):') ?? undefined;
    this.acting[row.checkoutId] = 'reject';
    this.cdr.markForCheck();
    this.service.reject(row.checkoutId, reason).subscribe({
      next: () => {
        this.acting[row.checkoutId] = undefined;
        this.flash = { kind: 'ok', text: 'Rejeição registrada.' };
        this.refresh();
      },
      error: err => {
        this.acting[row.checkoutId] = undefined;
        this.flash = { kind: 'err', text: (err?.error?.message || err?.message) ?? 'Falha ao rejeitar.' };
        this.cdr.markForCheck();
      }
    });
  }

  busy(row: ApprovalRequestRow): 'approve' | 'reject' | undefined {
    return this.acting[row.checkoutId];
  }
}

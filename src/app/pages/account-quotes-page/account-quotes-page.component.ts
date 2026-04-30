import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { take } from 'rxjs/operators';
import { JuliQuoteService, QuoteCreated } from '../../core/commerce/services/juli-quote.service';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-account-quotes-page',
  templateUrl: './account-quotes-page.component.html',
  styleUrls: ['./account-quotes-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountQuotesPageComponent implements OnInit {
  quotes: QuoteCreated[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private readonly quoteService: JuliQuoteService,
    private readonly authService: AuthService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.authService.session$.pipe(take(1)).subscribe(session => {
      if (!session?.username) {
        this.loading = false;
        this.error = 'Sessão expirada.';
        this.cdr.markForCheck();
        return;
      }
      this.quoteService.list(session.username).subscribe({
        next: list => {
          this.quotes = list;
          this.loading = false;
          this.cdr.markForCheck();
        },
        error: err => {
          this.error = (err?.error?.message || err?.message) ?? 'Falha ao carregar cotações.';
          this.loading = false;
          this.cdr.markForCheck();
        }
      });
    });
  }
}

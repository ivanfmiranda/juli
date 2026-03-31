import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, of, timer } from 'rxjs';
import { catchError, filter, map, shareReplay, switchMap, takeWhile, tap } from 'rxjs/operators';
import { JuliCartFacade, JuliCheckoutFacade, JuliCheckoutResult } from '../../core/commerce';
import { JuliI18nService } from '../../core/i18n/i18n.service';

type CheckoutConfirmationPhase = 'processing' | 'confirmed' | 'failed' | 'notFound' | 'unknown';

interface CheckoutConfirmationViewModel {
  checkoutId: string;
  phase: CheckoutConfirmationPhase;
  status: string;
  orderId?: string;
  approvalRequired: boolean;
  detail?: string;
  retries?: number;
  createdAt?: string;
  updatedAt?: string;
  terminal: boolean;
}

@Component({
  selector: 'app-checkout-confirmation-page',
  templateUrl: './checkout-confirmation-page.component.html',
  styleUrls: ['./checkout-confirmation-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutConfirmationPageComponent {
  private readonly refreshToken$: Observable<number> = of(0);

  readonly vm$: Observable<CheckoutConfirmationViewModel> = combineLatest([
    this.route.paramMap.pipe(
      map(params => params.get('checkoutId')),
      filter((checkoutId): checkoutId is string => !!checkoutId)
    ),
    this.refreshToken$
  ]).pipe(
    switchMap(([checkoutId]) => timer(0, 3000).pipe(
      switchMap(() => this.checkoutFacade.status(checkoutId).pipe(
        map(result => this.toViewModel(checkoutId, result)),
        catchError(error => of(this.toErrorViewModel(checkoutId, error)))
      )),
      takeWhile(viewModel => !viewModel.terminal, true)
    )),
    tap(viewModel => {
      if (viewModel.phase === 'confirmed') {
        this.cartFacade.clear();
      }
    }),
    shareReplay({ bufferSize: 1, refCount: true })
  );

  constructor(
    private readonly route: ActivatedRoute,
    private readonly checkoutFacade: JuliCheckoutFacade,
    private readonly cartFacade: JuliCartFacade,
    private readonly i18n: JuliI18nService
  ) {}

  private toViewModel(checkoutId: string, result: JuliCheckoutResult): CheckoutConfirmationViewModel {
    const status = (result.status || 'UNKNOWN').trim().toUpperCase();
    const phase = this.phaseFor(status, result.lastError);
    return {
      checkoutId,
      phase,
      status,
      orderId: result.orderId,
      approvalRequired: Boolean(result.approvalRequired),
      detail: result.detail || this.defaultDetail(phase, status, result.approvalRequired),
      retries: result.retries,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      terminal: phase === 'confirmed' || phase === 'failed'
    };
  }

  private toErrorViewModel(checkoutId: string, error: any): CheckoutConfirmationViewModel {
    const notFound = Number(error?.status) === 404;
    return {
      checkoutId,
      phase: notFound ? 'notFound' : 'unknown',
      status: notFound ? 'NOT_FOUND' : 'UNKNOWN',
      approvalRequired: false,
      detail: notFound
        ? this.i18n.translate('confirmation.detailNotFound')
        : (error?.error?.message || error?.message || this.i18n.translate('confirmation.detailUnknown')),
      terminal: true
    };
  }

  private phaseFor(status: string, lastError?: string): CheckoutConfirmationPhase {
    if (status === 'COMPLETED' || status === 'CONFIRMED') {
      return 'confirmed';
    }
    if (status === 'FAILED' || status === 'REJECTED' || Boolean(lastError)) {
      return 'failed';
    }
    return 'processing';
  }

  private defaultDetail(phase: CheckoutConfirmationPhase, status: string, approvalRequired?: boolean): string {
    if (phase === 'confirmed') {
      return this.i18n.translate('confirmation.detailConfirmed');
    }
    if (phase === 'failed') {
      return this.i18n.translate('confirmation.detailFailed');
    }
    if (approvalRequired || status === 'WAITING_APPROVAL') {
      return this.i18n.translate('confirmation.detailApproval');
    }
    return this.i18n.translate('confirmation.detailProcessing');
  }
}

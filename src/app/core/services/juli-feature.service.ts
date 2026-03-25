import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, take, tap } from 'rxjs/operators';
import { 
  FeatureEntitlement, 
  FeatureStatus, 
  TenantContext, 
  UsageLimitSummary, 
  SubscriptionStatus 
} from '../models/saas.models';
import { JuliSaaSConnector } from '../commerce/connectors/saas.connector';
import { JuliObservabilityService } from './observability.service';
import { JuliEvent } from '../models/observability.models';

@Injectable({ providedIn: 'root' })
export class JuliFeatureService {
  private readonly tenantContext$ = new BehaviorSubject<TenantContext | null>(null);
  private readonly usage$ = new BehaviorSubject<UsageLimitSummary[]>([]);

  readonly context$ = this.tenantContext$.asObservable();
  readonly activeSubscription$ = this.context$.pipe(
    map(ctx => ctx?.subscription)
  );

  constructor(
    private readonly connector: JuliSaaSConnector,
    private readonly obs: JuliObservabilityService
  ) {}

  /**
   * Inicializa o contexto do tenant e entitlements.
   */
  init(): Observable<TenantContext> {
    return this.connector.getContext().pipe(
      tap(ctx => {
        this.tenantContext$.next(ctx);
        this.obs.emitEvent(JuliEvent.TENANT_SWITCHED, { tenantId: ctx.tenantId, plan: ctx.subscription.planCode });
        
        if (ctx.subscription.status === SubscriptionStatus.CANCELLED || ctx.subscription.status === SubscriptionStatus.SUSPENDED) {
          this.obs.emitEvent(JuliEvent.SUBSCRIPTION_EXPIRED, { status: ctx.subscription.status });
        }
      }),
      tap(() => this.refreshUsage().subscribe())
    );
  }

  /**
   * Verifica se uma feature pode ser usada.
   */
  canUse(featureCode: string): Observable<boolean> {
    return this.getEntitlement(featureCode).pipe(
      map(e => e?.status === FeatureStatus.ENABLED),
      tap(can => {
        if (!can) this.obs.emitEvent(JuliEvent.ENTITLEMENT_DENIED, { featureCode });
      })
    );
  }

  /**
   * Verifica se uma feature deve ser exibida.
   */
  canView(featureCode: string): Observable<boolean> {
    return this.getEntitlement(featureCode).pipe(
      map(e => e?.status !== FeatureStatus.HIDDEN)
    );
  }

  /**
   * Retorna o status detalhado de uma feature para a UI decidir o comportamento (ex: readonly).
   */
  getFeatureStatus(featureCode: string): Observable<FeatureStatus> {
    return this.getEntitlement(featureCode).pipe(
      map(e => e?.status ?? FeatureStatus.DISABLED)
    );
  }

  /**
   * Verifica se um limite foi atingido.
   */
  isLimitReached(featureCode: string): Observable<boolean> {
    return this.usage$.pipe(
      map(usageList => {
        const usage = usageList.find(u => u.featureCode === featureCode);
        return !!(usage?.isHardLimitReached || usage?.isSoftLimitReached);
      }),
      tap(reached => {
        if (reached) this.obs.emitEvent(JuliEvent.PLAN_LIMIT_REACHED, { featureCode });
      })
    );
  }

  private getEntitlement(featureCode: string): Observable<FeatureEntitlement | undefined> {
    return this.context$.pipe(
      map(ctx => ctx?.entitlements.find(e => e.featureCode === featureCode))
    );
  }

  private refreshUsage(): Observable<UsageLimitSummary[]> {
    return this.connector.getUsage().pipe(
      tap(usage => this.usage$.next(usage))
    );
  }
}

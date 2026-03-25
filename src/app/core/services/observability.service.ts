import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { JuliEvent, JuliError, JuliLog, JuliErrorCategory } from '../models/observability.models';

@Injectable({ providedIn: 'root' })
export class JuliObservabilityService {
  private readonly storageKey = 'juli.correlation.id';
  private currentCorrelationId: string | null = null;
  private readonly eventsSubject = new Subject<{ event: JuliEvent; data?: any }>();
  private readonly logsSubject = new Subject<JuliLog>();
  private readonly errorsSubject = new Subject<JuliError>();
  
  // Flag para modo debug em tempo de execução
  private readonly isDebugEnabled$ = new BehaviorSubject<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem('juli.debug') === 'true'
  );

  readonly events$ = this.eventsSubject.asObservable();
  readonly logs$ = this.logsSubject.asObservable();
  readonly errors$ = this.errorsSubject.asObservable();
  readonly debugMode$ = this.isDebugEnabled$.asObservable();

  constructor() {
    this.currentCorrelationId = this.restoreId();
  }

  /**
   * Retorna o correlationId atual ou restaura do storage.
   */
  getCorrelationId(): string {
    if (!this.currentCorrelationId) {
      this.currentCorrelationId = this.restoreId();
    }
    return this.currentCorrelationId;
  }

  /**
   * Reseta o correlationId para uma nova operação lógica (ex: após finalizar pedido).
   */
  rotateCorrelationId(): string {
    const newId = this.generateId();
    this.currentCorrelationId = newId;
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(this.storageKey, newId);
    }
    return newId;
  }

  private restoreId(): string {
    if (typeof sessionStorage !== 'undefined') {
      const stored = sessionStorage.getItem(this.storageKey);
      if (stored) return stored;
    }
    return this.rotateCorrelationId();
  }

  /**
   * Dispara um evento de domínio estruturado.
   */
  emitEvent(event: JuliEvent, data?: any): void {
    const correlationId = this.getCorrelationId();
    this.eventsSubject.next({ event, data });
    
    this.log({
      level: 'INFO',
      event,
      message: `Domain Event: ${event}`,
      correlationId,
      context: data,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Registra um erro canônico.
   */
  reportError(error: Partial<JuliError>): void {
    const fullError: JuliError = {
      code: error.code || 'UNKNOWN_ERROR',
      category: error.category || JuliErrorCategory.UNKNOWN,
      source: error.source || 'JuliFrontend',
      operation: error.operation || 'unknown',
      retriable: error.retriable ?? false,
      userMessage: error.userMessage || 'An unexpected error occurred.',
      technicalMessage: error.technicalMessage,
      correlationId: error.correlationId || this.getCorrelationId(),
      timestamp: new Date().toISOString(),
      originalError: error.originalError
    };

    this.errorsSubject.next(fullError);
    
    this.log({
      level: 'ERROR',
      message: fullError.technicalMessage || fullError.userMessage,
      correlationId: fullError.correlationId,
      context: { code: fullError.code, category: fullError.category, operation: fullError.operation },
      timestamp: fullError.timestamp
    });
  }

  /**
   * Log estruturado interno.
   */
  log(log: JuliLog): void {
    const enrichedLog = { ...log, timestamp: log.timestamp || new Date().toISOString() };
    this.logsSubject.next(enrichedLog);

    if (this.isDebugEnabled$.value) {
      const color = log.level === 'ERROR' ? 'color: red' : log.level === 'WARN' ? 'color: orange' : 'color: green';
      console.log(`%c[Juli ${log.level}] [${log.correlationId}] ${log.message}`, color, log.context || '');
    }
  }

  setDebugMode(enabled: boolean): void {
    localStorage.setItem('juli.debug', String(enabled));
    this.isDebugEnabled$.next(enabled);
  }

  private generateId(): string {
    return 'juli-' + Math.random().toString(36).substring(2, 11) + '-' + Date.now().toString(36);
  }
}

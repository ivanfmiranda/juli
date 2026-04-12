/**
 * Fallback Policy Service
 * 
 * Centraliza a lógica de fallback para toda a aplicação.
 * Garante consistência e elimina a necessidade de componentes
 * individuais reinventarem estratégias de fallback.
 * 
 * Regras de Fallback:
 * - Tipo desconhecido → UnknownComponent
 * - Payload inválido → ErrorComponent  
 * - Conteúdo vazio → EmptyState
 * - Erro API → ErrorComponent
 * - Página inexistente → NotFoundPage
 */

import { Injectable } from '@angular/core';

export enum FallbackType {
  UNKNOWN_COMPONENT = 'UNKNOWN_COMPONENT',
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  EMPTY_CONTENT = 'EMPTY_CONTENT',
  API_ERROR = 'API_ERROR',
  PAGE_NOT_FOUND = 'PAGE_NOT_FOUND',
  LOADING = 'LOADING'
}

export interface FallbackDecision {
  type: FallbackType;
  component: string;
  message?: string;
  shouldLog: boolean;
  severity: 'info' | 'warning' | 'error';
}

export interface FallbackContext {
  typeCode?: string;
  slotName?: string;
  pageLabel?: string;
  error?: Error;
  originalPayload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class FallbackPolicyService {
  
  private readonly fallbackRegistry: Record<FallbackType, FallbackDecision> = {
    [FallbackType.UNKNOWN_COMPONENT]: {
      type: FallbackType.UNKNOWN_COMPONENT,
      component: 'UnknownComponent',
      message: 'Component type not registered',
      shouldLog: true,
      severity: 'warning'
    },
    [FallbackType.INVALID_PAYLOAD]: {
      type: FallbackType.INVALID_PAYLOAD,
      component: 'ErrorComponent',
      message: 'Invalid payload structure',
      shouldLog: true,
      severity: 'error'
    },
    [FallbackType.EMPTY_CONTENT]: {
      type: FallbackType.EMPTY_CONTENT,
      component: 'EmptyState',
      message: 'No content available',
      shouldLog: false,
      severity: 'info'
    },
    [FallbackType.API_ERROR]: {
      type: FallbackType.API_ERROR,
      component: 'ErrorComponent',
      message: 'Failed to load content',
      shouldLog: true,
      severity: 'error'
    },
    [FallbackType.PAGE_NOT_FOUND]: {
      type: FallbackType.PAGE_NOT_FOUND,
      component: 'NotFoundPage',
      message: 'Page not found',
      shouldLog: true,
      severity: 'warning'
    },
    [FallbackType.LOADING]: {
      type: FallbackType.LOADING,
      component: 'LoadingState',
      shouldLog: false,
      severity: 'info'
    }
  };

  /**
   * Decide qual fallback usar baseado no contexto
   */
  decide(context: FallbackContext): FallbackDecision {
    // Se temos um erro de API explícito
    if (context.error) {
      return this.enrichDecision(
        this.fallbackRegistry[FallbackType.API_ERROR],
        context
      );
    }

    // Página não encontrada deve ter prioridade sobre payload vazio ou tipo desconhecido
    if (this.isPageNotFoundLabel(context.pageLabel)) {
      return this.enrichDecision(
        this.fallbackRegistry[FallbackType.PAGE_NOT_FOUND],
        context
      );
    }

    // Se o typeCode existe mas é desconhecido (validação externa necessária)
    if (context.typeCode === 'UnknownType') {
      return this.enrichDecision(
        this.fallbackRegistry[FallbackType.UNKNOWN_COMPONENT],
        context
      );
    }

    // Payload vazio
    if (this.isEmptyPayload(context.originalPayload)) {
      return this.enrichDecision(
        this.fallbackRegistry[FallbackType.EMPTY_CONTENT],
        context
      );
    }

    // Caso padrão: payload inválido
    return this.enrichDecision(
      this.fallbackRegistry[FallbackType.INVALID_PAYLOAD],
      context
    );
  }

  /**
   * Retorna o decision para loading
   */
  getLoadingDecision(): FallbackDecision {
    return this.fallbackRegistry[FallbackType.LOADING];
  }

  /**
   * Retorna o decision para tipo específico
   */
  getDecisionForType(type: FallbackType): FallbackDecision {
    return this.fallbackRegistry[type];
  }

  /**
   * Verifica se um payload está vazio
   */
  private isEmptyPayload(payload: any): boolean {
    if (!payload) return true;
    if (Array.isArray(payload) && payload.length === 0) return true;
    if (typeof payload === 'object' && Object.keys(payload).length === 0) return true;
    return false;
  }

  private isPageNotFoundLabel(label?: string): boolean {
    if (!label) {
      return false;
    }
    const normalized = label.trim().toLowerCase();
    return normalized === '404' || normalized === 'not-found' || normalized === 'page-not-found';
  }

  /**
   * Enriquece a decisão com contexto específico
   */
  private enrichDecision(
    decision: FallbackDecision, 
    context: FallbackContext
  ): FallbackDecision {
    return {
      ...decision,
      message: this.buildMessage(decision, context)
    };
  }

  /**
   * Constrói mensagem contextualizada
   */
  private buildMessage(decision: FallbackDecision, context: FallbackContext): string {
    const parts: string[] = [decision.message || ''];
    
    if (context.typeCode) {
      parts.push(`[Type: ${context.typeCode}]`);
    }
    if (context.slotName) {
      parts.push(`[Slot: ${context.slotName}]`);
    }
    if (context.pageLabel) {
      parts.push(`[Page: ${context.pageLabel}]`);
    }
    if (context.error?.message) {
      parts.push(`[Error: ${context.error.message}]`);
    }

    return parts.join(' ');
  }
}

/**
 * Helper para logging de fallbacks (para uso em dev mode)
 */
export function logFallbackDecision(decision: FallbackDecision, context: FallbackContext): void {
  if (!decision.shouldLog) return;

  const styles = {
    info: 'color: #0dcaf0',
    warning: 'color: #ffc107',
    error: 'color: #dc3545; font-weight: bold'
  };

  console.log(
    `%c[FALLBACK] ${decision.type}: ${decision.message}`,
    styles[decision.severity]
  );

  if (context.originalPayload && decision.severity === 'error') {
    console.log('Original payload:', context.originalPayload);
  }
}

/**
 * Error Component Renderer
 * 
 * Fallback para quando há um erro técnico ao renderizar um componente
 * ou quando o payload recebido é inválido/corrompido.
 * 
 * Este componente sempre renderiza (tanto em dev quanto produção)
 * para garantir que o usuário saiba que algo deu errado.
 */

import { ChangeDetectionStrategy, Component, Inject, Input, Optional } from '@angular/core';
import { JULI_CMS_COMPONENT_DATA, JuliCmsComponentContext } from '../tokens';
import { Observable, defer, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { FallbackComponentData } from '../../models/cms.model';
import { JuliI18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-error-component',
  template: `
    <div class="juli-fallback error" role="alert" *ngIf="data$ | async as data">
      <div class="juli-fallback-content">
        <div class="juli-fallback-icon">⚠️</div>
        <div class="juli-fallback-text">
          <strong>{{ 'fallback.errorTitle' | juliTranslate }}</strong>
          <code class="juli-type-code" *ngIf="(data.originalType || data.typeCode) !== 'N/A'">{{ data.originalType || data.typeCode }}</code>
          <p class="juli-error-message" *ngIf="data.errorMessage || errorMessage">{{ data.errorMessage || errorMessage }}</p>
          <p class="juli-fallback-hint">
            {{ 'fallback.errorHint' | juliTranslate }}
          </p>
          <button 
            *ngIf="showRetry"
            class="juli-retry-btn"
            (click)="onRetry()"
          >
            {{ 'fallback.retry' | juliTranslate }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .juli-fallback {
      padding: 1.5rem;
      border-radius: 8px;
      margin: 0.5rem 0;
    }
    
    .juli-fallback.error {
      border: 2px solid #dc3545;
      background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
    }
    
    .juli-fallback-content {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .juli-fallback-icon {
      font-size: 2rem;
      flex-shrink: 0;
    }
    
    .juli-fallback-text {
      flex: 1;
    }
    
    .juli-fallback-text strong {
      display: block;
      color: #721c24;
      font-size: 1.1rem;
      margin-bottom: 0.25rem;
    }
    
    .juli-type-code {
      display: inline-block;
      background: #fff;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      color: #dc3545;
      margin: 0.25rem 0;
      border: 1px solid #dc3545;
    }
    
    .juli-error-message {
      margin: 0.5rem 0 0 0;
      font-size: 0.875rem;
      color: #721c24;
      font-style: italic;
    }
    
    .juli-fallback-hint {
      margin: 0.5rem 0 0 0;
      font-size: 0.875rem;
      color: #721c24;
      line-height: 1.5;
    }
    
    .juli-retry-btn {
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.9rem;
      transition: background 0.2s;
    }
    
    .juli-retry-btn:hover {
      background: #c82333;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorComponent {
  @Input() typeCode: string = 'N/A';
  @Input() errorMessage?: string;
  @Input() showRetry: boolean = false;
  @Input() retryHandler?: () => void;
  data$: Observable<FallbackComponentData>;

  constructor(@Optional() @Inject(JULI_CMS_COMPONENT_DATA) protected componentData?: JuliCmsComponentContext<FallbackComponentData>) {
    this.data$ = this.componentData?.data$.pipe(
      map(data => data ?? this.defaultData())
    ) ?? defer(() => of(this.defaultData()));
  }

  onRetry(): void {
    if (this.retryHandler) {
      this.retryHandler();
    } else {
      this.reloadPage();
    }
  }

  reloadPage(): void {
    window.location.reload();
  }

  private defaultData(): FallbackComponentData {
    return {
      uid: 'error',
      typeCode: this.typeCode,
      flexType: this.typeCode,
      status: 'invalid',
      errorMessage: this.errorMessage
    };
  }
}

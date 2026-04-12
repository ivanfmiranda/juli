/**
 * Loading State Renderer
 * 
 * Indicador de carregamento para componentes CMS.
 * Usado enquanto os dados estão sendo buscados do backend.
 * 
 * Design sutil que não quebra o layout mas dá feedback visual.
 */

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { JuliI18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-loading-state',
  template: `
    <div class="juli-loading-state" [class.minimal]="minimal" role="status" aria-live="polite">
      <div class="juli-loading-content">
        <div class="juli-spinner" *ngIf="!minimal">
          <div class="juli-spinner-ring"></div>
        </div>
        <div class="juli-pulse" *ngIf="minimal"></div>
        <p class="juli-loading-text" *ngIf="showText && !minimal">
          {{ loadingText || ('fallback.loading' | juliTranslate) }}
        </p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .juli-loading-state {
      min-height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }
    
    .juli-loading-state.minimal {
      min-height: 60px;
      padding: 0.75rem;
    }
    
    .juli-loading-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }
    
    /* Spinner elegante */
    .juli-spinner {
      position: relative;
      width: 40px;
      height: 40px;
    }
    
    .juli-spinner-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 3px solid #e9ecef;
      border-top-color: #0d6efd;
      border-radius: 50%;
      animation: juli-spin 1s linear infinite;
    }
    
    @keyframes juli-spin {
      to {
        transform: rotate(360deg);
      }
    }
    
    /* Pulse minimalista */
    .juli-pulse {
      width: 100%;
      height: 4px;
      background: linear-gradient(90deg, #e9ecef 25%, #dee2e6 50%, #e9ecef 75%);
      background-size: 200% 100%;
      border-radius: 2px;
      animation: juli-pulse 1.5s ease-in-out infinite;
    }
    
    @keyframes juli-pulse {
      0% {
        background-position: 200% 0;
      }
      100% {
        background-position: -200% 0;
      }
    }
    
    .juli-loading-text {
      margin: 0;
      font-size: 0.875rem;
      color: #6c757d;
      text-align: center;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingStateRenderer {
  @Input() loadingText: string = '';
  @Input() showText: boolean = true;
  @Input() minimal: boolean = false;
}

/**
 * Empty State Renderer
 * 
 * Fallback para quando o conteúdo vindo do CMS está vazio
 * ou quando uma região/slot não tem componentes.
 * 
 * Renderização sutil para não poluir a UI em produção,
 * mas visível em desenvolvimento para facilitar debugging.
 */

import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { isDevMode } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="juli-fallback empty" *ngIf="isDevMode || showInProduction">
      <div class="juli-fallback-content">
        <div class="juli-fallback-icon" *ngIf="isDevMode">📭</div>
        <div class="juli-fallback-text">
          <ng-container *ngIf="isDevMode">
            <strong>Conteúdo Vazio</strong>
            <code class="juli-slot-code" *ngIf="slotName">{{ slotName }}</code>
            <p class="juli-fallback-hint">
              Este bloco não possui conteúdo configurado no CMS.
              <span *ngIf="contentType">
                <br>
                Tipo esperado: <code>{{ contentType }}</code>
              </span>
            </p>
          </ng-container>
          <ng-container *ngIf="!isDevMode">
            <!-- Em produção: renderização mínima ou nada -->
            <span class="juli-placeholder" *ngIf="showPlaceholder">&nbsp;</span>
          </ng-container>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
    
    .juli-fallback {
      padding: 1rem;
      border-radius: 8px;
      margin: 0.5rem 0;
    }
    
    .juli-fallback.empty {
      border: 1px dashed #dee2e6;
      background: #f8f9fa;
      opacity: 0.7;
    }
    
    .juli-fallback-content {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
    }
    
    .juli-fallback-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
      opacity: 0.6;
    }
    
    .juli-fallback-text {
      flex: 1;
    }
    
    .juli-fallback-text strong {
      display: block;
      color: #6c757d;
      font-size: 0.9rem;
      margin-bottom: 0.25rem;
    }
    
    .juli-slot-code {
      display: inline-block;
      background: #e9ecef;
      padding: 0.125rem 0.375rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.8rem;
      color: #495057;
      margin: 0.25rem 0;
    }
    
    .juli-fallback-hint {
      margin: 0.25rem 0 0 0;
      font-size: 0.8rem;
      color: #868e96;
      line-height: 1.4;
    }
    
    .juli-fallback-hint code {
      background: rgba(0,0,0,0.05);
      padding: 0.0625rem 0.25rem;
      border-radius: 3px;
      font-size: 0.75rem;
    }
    
    .juli-placeholder {
      display: block;
      min-height: 1px;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EmptyStateComponent {
  @Input() slotName?: string;
  @Input() contentType?: string;
  @Input() showInProduction: boolean = false;
  @Input() showPlaceholder: boolean = true;
  
  isDevMode = isDevMode();
}

/**
 * Unknown Component Renderer
 * 
 * Fallback para quando um tipo de componente CMS é recebido
 * mas não existe um Angular component registrado para ele.
 * 
 * Em desenvolvimento: Mostra alerta visível para o desenvolvedor
 * Em produção: Renderiza silenciosamente (ou pode ser configurado para não renderizar)
 */

import { ChangeDetectionStrategy, Component, Input, Optional, isDevMode } from '@angular/core';
import { CmsComponentData } from '@spartacus/storefront';
import { Observable, defer, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { FallbackComponentData } from '../../models/cms.model';

@Component({
  selector: 'app-unknown-component',
  template: `
    <div class="juli-fallback unknown" *ngIf="isDevMode && (data$ | async) as data">
      <div class="juli-fallback-content">
        <div class="juli-fallback-icon">❓</div>
        <div class="juli-fallback-text">
          <strong>Componente Não Mapeado</strong>
          <code class="juli-type-code">{{ data.originalType || data.typeCode }}</code>
          <p class="juli-fallback-hint">
            Este tipo de componente não possui um mapeamento no Angular.
            <br>
            Verifique o <code>StrapiCmsModule</code> e adicione o mapeamento necessário.
          </p>
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
    
    .juli-fallback.unknown {
      border: 2px dashed #ffc107;
      background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
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
      color: #856404;
      font-size: 1rem;
      margin-bottom: 0.25rem;
    }
    
    .juli-type-code {
      display: inline-block;
      background: #fff;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 0.875rem;
      color: #d63384;
      margin: 0.25rem 0;
      border: 1px solid #ffc107;
    }
    
    .juli-fallback-hint {
      margin: 0.5rem 0 0 0;
      font-size: 0.875rem;
      color: #856404;
      line-height: 1.5;
    }
    
    .juli-fallback-hint code {
      background: rgba(0,0,0,0.1);
      padding: 0.125rem 0.25rem;
      border-radius: 3px;
      font-size: 0.8rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnknownComponent {
  @Input() typeCode: string = 'N/A';
  data$: Observable<FallbackComponentData>;
  isDevMode = isDevMode();

  constructor(@Optional() protected componentData?: CmsComponentData<FallbackComponentData>) {
    this.data$ = this.componentData?.data$.pipe(
      map(data => data ?? this.defaultData())
    ) ?? defer(() => of(this.defaultData()));
  }

  private defaultData(): FallbackComponentData {
    return {
      uid: 'unknown',
      typeCode: this.typeCode,
      flexType: this.typeCode,
      status: 'unknown'
    };
  }
}

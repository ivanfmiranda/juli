/**
 * InfoCard Component
 * 
 * Componente simples para exibir informações em formato de card.
 * Ideal para: features, benefícios, highlights, ou callouts.
 * 
 * Modelo Canônico: InfoCardComponentModel
 * - icon: Emoji ou ícone (ex: "🚀", "⭐")
 * - title: Título do card
 * - description: Descrição textual
 * - link: Link opcional (se clicável)
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CmsComponentData } from '@spartacus/storefront';
import { InfoCardComponentModel } from '../../../core/models/cms.model';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-info-card',
  templateUrl: './info-card.component.html',
  styleUrls: ['./info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoCardComponent {
  data$: Observable<InfoCardComponentModel> = this.componentData.data$;

  constructor(
    protected componentData: CmsComponentData<InfoCardComponentModel>
  ) {}
}

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

import { Component, ChangeDetectionStrategy, Inject, Optional } from '@angular/core';
import { InfoCardComponentModel } from '../../../core/models/cms.model';
import { JULI_CMS_COMPONENT_DATA, JuliCmsComponentContext } from '../../../core/cms/tokens';
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
    @Optional() @Inject(JULI_CMS_COMPONENT_DATA) protected componentData: JuliCmsComponentContext<InfoCardComponentModel>
  ) {}
}

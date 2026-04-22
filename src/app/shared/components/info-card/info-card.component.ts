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
import { IconName } from '../icon/icon.component';

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

  /**
   * Maps legacy emoji icons coming from Strapi to Lucide outline icon
   * names. Storefronts shipping after E3 should prefer setting the
   * canonical name directly (e.g. "truck", "shield-check") — unknown or
   * missing values fall back to {@code badge-check}.
   */
  resolveIcon(raw: string | undefined): IconName {
    if (!raw) return 'badge-check';
    const trimmed = raw.trim().toLowerCase();
    const emojiMap: Record<string, IconName> = {
      '🚀': 'zap',
      '📦': 'package',
      '🚚': 'truck',
      '🔒': 'lock',
      '🔐': 'lock',
      '💳': 'credit-card',
      '⭐': 'star',
      '🛒': 'shopping-cart',
      '❤️': 'heart',
      '🔧': 'wrench',
      '🛠️': 'wrench',
      '🎧': 'headset',
      '🔍': 'search',
      '✅': 'check',
      '✓': 'check',
      '⚡': 'zap',
      '🛡️': 'shield-check',
      '✔️': 'badge-check',
    };
    if (emojiMap[trimmed]) return emojiMap[trimmed];
    // Already a canonical name (typed by CMS editor): pass through if valid.
    const validNames: IconName[] = [
      'shopping-cart', 'x', 'heart', 'star', 'package', 'truck',
      'shield-check', 'credit-card', 'wrench', 'headset', 'search',
      'check', 'zap', 'lock', 'badge-check', 'arrow-right',
    ];
    return (validNames as string[]).includes(trimmed) ? trimmed as IconName : 'badge-check';
  }
}

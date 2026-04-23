/**
 * Not Found Page Renderer
 * 
 * Página completa 404 para quando uma rota/página não existe.
 * Diferente dos outros fallbacks, este é uma página inteira,
 * não apenas um componente dentro de um slot.
 */

import { Component, ChangeDetectionStrategy } from '@angular/core';
import { JuliI18nService } from '../../i18n/i18n.service';

@Component({
  selector: 'app-not-found-page',
  template: `
    <main class="juli-not-found" role="main">
      <div class="juli-not-found-content">
        <div class="juli-not-found-code" aria-hidden="true">404</div>
        <h1 class="juli-not-found-title">{{ 'fallback.notFoundTitle' | juliTranslate }}</h1>
        <p class="juli-not-found-message">
          {{ 'fallback.notFoundMessage' | juliTranslate }}
        </p>
        <div class="juli-not-found-actions">
          <a routerLink="/" class="juli-btn juli-btn-primary">
            {{ 'fallback.backToHome' | juliTranslate }}
          </a>
          <button class="juli-btn juli-btn-secondary" (click)="goBack()">
            {{ 'fallback.goBack' | juliTranslate }}
          </button>
        </div>
      </div>
    </main>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
    }
    
    .juli-not-found {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: var(--color-background, #f8f9fa);
    }

    .juli-not-found-content {
      text-align: center;
      max-width: 500px;
    }

    .juli-not-found-code {
      font-size: 8rem;
      font-weight: 900;
      color: var(--color-border, #dee2e6);
      line-height: 1;
      margin-bottom: 1rem;
    }

    .juli-not-found-title {
      font-size: 2rem;
      font-weight: 600;
      color: var(--color-text, #343a40);
      margin: 0 0 1rem 0;
    }

    .juli-not-found-message {
      font-size: 1.1rem;
      color: var(--color-text-muted, #6c757d);
      margin: 0 0 2rem 0;
      line-height: 1.6;
    }

    .juli-not-found-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }

    .juli-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 500;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s;
      border: none;
    }

    .juli-btn-primary {
      background: var(--color-primary, #0d6efd);
      color: white;
    }

    .juli-btn-primary:hover {
      background: var(--color-primary-dark, #0b5ed7);
      transform: translateY(-1px);
    }

    .juli-btn-secondary {
      background: var(--color-surface, white);
      color: var(--color-text, #495057);
      border: 1px solid var(--color-border, #dee2e6);
    }

    .juli-btn-secondary:hover {
      background: var(--color-background, #f8f9fa);
    }
    
    @media (max-width: 480px) {
      .juli-not-found-code {
        font-size: 5rem;
      }
      
      .juli-not-found-title {
        font-size: 1.5rem;
      }
      
      .juli-not-found-actions {
        flex-direction: column;
      }
      
      .juli-btn {
        width: 100%;
        justify-content: center;
      }
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundPageComponent {
  goBack(): void {
    window.history.back();
  }
}

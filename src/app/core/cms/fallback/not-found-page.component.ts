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
    <div class="juli-not-found">
      <div class="juli-not-found-content">
        <div class="juli-not-found-code">404</div>
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
    </div>
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
      background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
    }
    
    .juli-not-found-content {
      text-align: center;
      max-width: 500px;
    }
    
    .juli-not-found-code {
      font-size: 8rem;
      font-weight: 900;
      color: #dee2e6;
      line-height: 1;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 0 #adb5bd;
    }
    
    .juli-not-found-title {
      font-size: 2rem;
      font-weight: 600;
      color: #343a40;
      margin: 0 0 1rem 0;
    }
    
    .juli-not-found-message {
      font-size: 1.1rem;
      color: #6c757d;
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
      background: #0d6efd;
      color: white;
    }
    
    .juli-btn-primary:hover {
      background: #0b5ed7;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(13, 110, 253, 0.3);
    }
    
    .juli-btn-secondary {
      background: white;
      color: #495057;
      border: 1px solid #dee2e6;
    }
    
    .juli-btn-secondary:hover {
      background: #f8f9fa;
      border-color: #adb5bd;
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

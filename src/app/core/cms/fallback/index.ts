/**
 * Fallback System Public API
 * 
 * Exporta todos os componentes e serviços de fallback
 * para uso em toda a aplicação.
 */

// Components
export { UnknownComponent } from './unknown-component.component';
export { ErrorComponent } from './error-component.component';
export { EmptyStateComponent } from './empty-state.component';
export { LoadingStateRenderer } from './loading-state.component';
export { NotFoundPageComponent } from './not-found-page.component';

// Services
export { 
  FallbackPolicyService, 
  FallbackType, 
  FallbackDecision, 
  FallbackContext,
  logFallbackDecision 
} from './fallback-policy.service';

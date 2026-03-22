/**
 * Core User Module
 * 
 * Módulo minimalista de usuário usando apenas API pública do Spartacus.
 * 
 * Substitui UserTransitional_4_2_Module para evitar NullInjectorError
 * com NotificationPreferenceEffects.
 * 
 * @see docs/COMPAT-LAYER-WORKAROUNDS.md
 */

export { MinimalUserModule } from './minimal-user.module';

/**
 * Custom User Transitional Module - Simplified Version
 * 
 * This is a fallback implementation that uses only public API exports
 * from @spartacus/core. Use this if the deep imports in the main
 * custom-user-transitional.module.ts cause issues.
 * 
 * LIMITATION: This version may not include all the reducers and state
 * configuration from the original UserTransitional_4_2_Module.
 */

import { NgModule, ModuleWithProviders, Optional, SkipSelf } from '@angular/core';
import { EffectsModule } from '@ngrx/effects';

// Public API imports only
import { UserModule, UserConnector } from '@spartacus/core';

// Custom effects array (without NotificationPreferenceEffects)
import { customEffectsTransitional_4_2, logRegisteredEffects } from './custom-effects-transitional_4_2';

/**
 * Simplified custom user transitional module.
 * 
 * This module:
 * 1. Imports UserModule for basic user functionality
 * 2. Registers custom effects (excluding NotificationPreferenceEffects)
 * 3. Guards against multiple instantiations
 */
@NgModule({
  imports: [
    UserModule,
    EffectsModule.forFeature(customEffectsTransitional_4_2),
  ],
})
export class CustomUserTransitionalSimpleModule {
  
  constructor(@Optional() @SkipSelf() parentModule?: CustomUserTransitionalSimpleModule) {
    if (parentModule) {
      throw new Error(
        'CustomUserTransitionalSimpleModule is already loaded. Import it in the AppModule only.'
      );
    }
    
    // Log registered effects in debug mode
    logRegisteredEffects();
    
    if (typeof window !== 'undefined' && (window as any).__spartacus_debug) {
      console.log('[CustomUserTransitionalSimpleModule] Initialized (simplified version)');
    }
  }
  
  static forRoot(): ModuleWithProviders<CustomUserTransitionalSimpleModule> {
    return {
      ngModule: CustomUserTransitionalSimpleModule,
      providers: [
        // Add any additional providers here if needed
      ],
    };
  }
}

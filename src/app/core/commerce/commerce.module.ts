import { ModuleWithProviders, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

@NgModule({
  imports: [CommonModule]
})
export class CommerceModule {
  static forRoot(): ModuleWithProviders<CommerceModule> {
    return {
      ngModule: CommerceModule
    };
  }
}

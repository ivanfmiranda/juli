import { NgModule } from '@angular/core';
import { JuliTranslatePipe } from './translate.pipe';

@NgModule({
  declarations: [JuliTranslatePipe],
  exports: [JuliTranslatePipe]
})
export class JuliI18nModule {}

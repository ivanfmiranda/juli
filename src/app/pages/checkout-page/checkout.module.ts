import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { CheckoutRoutingModule } from './checkout-routing.module';
import { JuliI18nModule } from '../../core/i18n/i18n.module';
import { CheckoutPageComponent } from './checkout-page.component';
import { CheckoutConfirmationPageComponent } from '../checkout-confirmation-page/checkout-confirmation-page.component';
import { CheckoutStepperComponent } from '../../shared/components/checkout-stepper/checkout-stepper.component';
import { CheckoutSummaryComponent } from '../../shared/components/checkout-summary/checkout-summary.component';
import { SoftLoginPromptComponent } from '../../shared/components/soft-login-prompt/soft-login-prompt.component';

@NgModule({
  declarations: [
    CheckoutPageComponent,
    CheckoutConfirmationPageComponent,
    CheckoutStepperComponent,
    CheckoutSummaryComponent,
    SoftLoginPromptComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    JuliI18nModule,
    CheckoutRoutingModule
  ]
})
export class CheckoutModule {}

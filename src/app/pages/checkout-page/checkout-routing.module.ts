import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CheckoutPageComponent } from './checkout-page.component';
import { CheckoutConfirmationPageComponent } from '../checkout-confirmation-page/checkout-confirmation-page.component';

const routes: Routes = [
  { path: '', component: CheckoutPageComponent },
  { path: 'confirmation/:checkoutId', component: CheckoutConfirmationPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CheckoutRoutingModule {}

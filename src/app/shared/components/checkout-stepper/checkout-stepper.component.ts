import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface CheckoutStep {
  id: string;
  label: string;
  description?: string;
  completed: boolean;
  active: boolean;
  disabled?: boolean;
}

@Component({
  selector: 'app-checkout-stepper',
  templateUrl: './checkout-stepper.component.html',
  styleUrls: ['./checkout-stepper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CheckoutStepperComponent {
  @Input() steps: CheckoutStep[] = [];
  @Input() currentStepId = '';

  get currentStepIndex(): number {
    return this.steps.findIndex(s => s.id === this.currentStepId);
  }

  isStepAccessible(stepIndex: number): boolean {
    const currentIndex = this.currentStepIndex;
    // Allow access to current step, previous steps, and next step if current is complete
    if (stepIndex <= currentIndex) return true;
    if (stepIndex === currentIndex + 1) {
      return this.steps[currentIndex]?.completed ?? false;
    }
    return false;
  }
}

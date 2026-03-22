import { Component, ChangeDetectionStrategy, Input, Output, EventEmitter } from '@angular/core';

/**
 * SoftLoginPrompt Component
 * 
 * Modal/dialog component that prompts the user to login when they try to checkout
 * with an anonymous cart. Provides options to sign in or continue browsing.
 */
@Component({
  selector: 'app-soft-login-prompt',
  templateUrl: './soft-login-prompt.component.html',
  styleUrls: ['./soft-login-prompt.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SoftLoginPromptComponent {
  /** Controls the visibility of the modal */
  @Input() isOpen = false;

  /** Emitted when the user clicks the "Sign In" button */
  @Output() login = new EventEmitter<void>();

  /** Emitted when the user clicks "Continue Browsing" or closes the modal */
  @Output() continueBrowsing = new EventEmitter<void>();

  /**
   * Handles the login button click
   */
  onLogin(): void {
    this.login.emit();
  }

  /**
   * Handles the continue browsing button click
   */
  onContinueBrowsing(): void {
    this.continueBrowsing.emit();
  }

  /**
   * Handles the close button (X) click
   */
  onClose(): void {
    this.continueBrowsing.emit();
  }
}

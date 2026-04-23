import { Component, Input } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JuliI18nService } from '../../../core/i18n/i18n.service';

@Component({
  selector: 'app-form-block',
  template: `
    <section class="pb-form">
      <h3 *ngIf="props?.title" class="pb-form__title">{{ props.title }}</h3>
      <form (ngSubmit)="onSubmit()" class="pb-form__form">
        <div *ngFor="let field of props?.fields || []" class="pb-form__field">
          <label class="pb-form__label">
            {{ field.label }}
            <span *ngIf="field.required" class="pb-form__required">*</span>
          </label>

          <input
            *ngIf="field.type === 'text' || field.type === 'email' || field.type === 'tel'"
            class="pb-form__input"
            [type]="field.type"
            [placeholder]="field.placeholder || ''"
            [required]="field.required"
            [name]="field.label"
            [(ngModel)]="formData[field.label]"
          />

          <textarea
            *ngIf="field.type === 'textarea'"
            class="pb-form__textarea"
            [placeholder]="field.placeholder || ''"
            [required]="field.required"
            [name]="field.label"
            [(ngModel)]="formData[field.label]"
            rows="4"
          ></textarea>

          <select
            *ngIf="field.type === 'select'"
            class="pb-form__select"
            [required]="field.required"
            [name]="field.label"
            [(ngModel)]="formData[field.label]"
          >
            <option value="" disabled selected>{{ field.placeholder || ('formBlock.selectPlaceholder' | juliTranslate) }}</option>
            <option *ngFor="let opt of field.options || []" [value]="opt">{{ opt }}</option>
          </select>
        </div>

        <button type="submit" class="pb-form__submit" [disabled]="submitting">
          {{ submitting ? ('formBlock.submitting' | juliTranslate) : (props?.submitLabel || ('formBlock.submitDefault' | juliTranslate)) }}
        </button>
      </form>

      <div *ngIf="feedback" class="pb-form__feedback" [class.pb-form__feedback--error]="feedbackError">
        {{ feedback }}
      </div>
    </section>
  `,
  styles: [`
    .pb-form { padding: 24px 0; margin-bottom: 16px; }
    .pb-form__title { font-size: 22px; font-weight: 600; margin: 0 0 16px; color: var(--color-text, #1a1a2e); }
    .pb-form__form { display: flex; flex-direction: column; gap: 16px; }
    .pb-form__field { display: flex; flex-direction: column; gap: 4px; }
    .pb-form__label { font-size: 14px; font-weight: 500; color: var(--color-text, #333); }
    .pb-form__required { color: var(--color-error, #e53e3e); }
    .pb-form__input, .pb-form__textarea, .pb-form__select {
      padding: 10px 12px; border: 1px solid var(--color-border, #d1d5db); border-radius: 6px; font-size: 15px;
      font-family: inherit; background: var(--color-surface, #fff); color: var(--color-text, #333); transition: border-color 0.2s;
    }
    .pb-form__input:focus, .pb-form__textarea:focus, .pb-form__select:focus {
      outline: none; border-color: var(--color-primary, #4f46e5); box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-primary, #4f46e5) 15%, transparent);
    }
    .pb-form__submit {
      align-self: flex-start; padding: 10px 28px; background: var(--color-primary, #4f46e5); color: #fff;
      border: none; border-radius: 6px; font-weight: 600; font-size: 15px; cursor: pointer;
      transition: background 0.2s;
    }
    .pb-form__submit:hover { background: var(--color-primary-dark, #4338ca); }
    .pb-form__submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .pb-form__feedback { margin-top: 12px; padding: 10px 16px; border-radius: 6px; font-size: 14px; background: var(--color-success-bg, #d1fae5); color: var(--color-success-text, #065f46); }
    .pb-form__feedback--error { background: var(--color-error-bg, #fee2e2); color: var(--color-error-text, #991b1b); }
  `]
})
export class FormBlockComponent {
  @Input() props: any = {};

  formData: Record<string, string> = {};
  submitting = false;
  feedback = '';
  feedbackError = false;

  constructor(private http: HttpClient, private i18n: JuliI18nService) {}

  onSubmit(): void {
    if (!this.props?.endpoint || this.submitting) return;

    this.submitting = true;
    this.feedback = '';
    this.feedbackError = false;

    this.http.post(this.props.endpoint, this.formData).subscribe({
      next: () => {
        this.feedback = this.i18n.translate('formBlock.successMessage');
        this.feedbackError = false;
        this.submitting = false;
        this.formData = {};
      },
      error: () => {
        this.feedback = this.i18n.translate('formBlock.errorMessage');
        this.feedbackError = true;
        this.submitting = false;
      }
    });
  }
}

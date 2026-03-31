import { ChangeDetectorRef, OnDestroy, Pipe, PipeTransform } from '@angular/core';
import { Subscription } from 'rxjs';
import { JuliI18nService } from './i18n.service';

@Pipe({
  name: 'juliTranslate',
  pure: false
})
export class JuliTranslatePipe implements PipeTransform, OnDestroy {
  private readonly subscription: Subscription;
  private currentLocale = '';
  private lastKey = '';
  private lastValue = '';

  constructor(private readonly i18n: JuliI18nService, private readonly cdr: ChangeDetectorRef) {
    this.subscription = this.i18n.locale$.subscribe(locale => {
      this.currentLocale = locale;
      this.lastKey = '';
      this.cdr.markForCheck();
    });
  }

  transform(key: string, params?: Record<string, string | number | undefined>): string {
    if (!key) {
      return '';
    }
    const cacheKey = `${this.currentLocale}:${key}:${JSON.stringify(params ?? {})}`;
    if (cacheKey !== this.lastKey) {
      this.lastKey = cacheKey;
      this.lastValue = this.i18n.translate(key, params);
    }
    return this.lastValue;
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}

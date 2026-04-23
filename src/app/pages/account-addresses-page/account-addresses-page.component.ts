import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  OnInit
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { ProfileAddressService } from '../../core/commerce/services/profile-address.service';
import { JuliSavedAddress } from '../../core/commerce/models/ubris-commerce.models';
import { JuliI18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-account-addresses-page',
  templateUrl: './account-addresses-page.component.html',
  styleUrls: ['./account-addresses-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AccountAddressesPageComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  addresses: JuliSavedAddress[] = [];
  loading = false;
  saving = false;
  errorMessage?: string;
  showAddForm = false;

  readonly form = this.fb.group({
    fullName: ['', Validators.required],
    line1: ['', Validators.required],
    line2: [''],
    city: ['', Validators.required],
    region: [''],
    postalCode: ['', Validators.required],
    countryIso: ['BR', Validators.required],
    phone: [''],
    notes: ['']
  });

  constructor(
    private readonly fb: UntypedFormBuilder,
    private readonly profileAddressService: ProfileAddressService,
    private readonly cdr: ChangeDetectorRef,
    readonly i18n: JuliI18nService
  ) {}

  ngOnInit(): void {
    this.loadAddresses();
  }

  loadAddresses(): void {
    this.loading = true;
    this.errorMessage = undefined;
    this.profileAddressService.listAddresses().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: addresses => {
        this.addresses = addresses;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = this.i18n.translate('addresses.loadFailed');
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openAddForm(): void {
    this.form.reset({ countryIso: 'BR' });
    this.showAddForm = true;
    this.errorMessage = undefined;
    this.cdr.markForCheck();
  }

  cancelAdd(): void {
    this.showAddForm = false;
    this.cdr.markForCheck();
  }

  saveAddress(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.errorMessage = undefined;
    const v = this.form.value;
    this.profileAddressService.addAddress({
      fullName: v.fullName,
      line1: v.line1,
      line2: v.line2 || undefined,
      city: v.city,
      region: v.region || undefined,
      postalCode: v.postalCode,
      countryIso: v.countryIso || 'BR',
      phone: v.phone || undefined,
      notes: v.notes || undefined
    }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: addr => {
        this.addresses = [...this.addresses, addr];
        this.showAddForm = false;
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = this.i18n.translate('addresses.saveFailed');
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteAddress(addressId: string): void {
    this.profileAddressService.deleteAddress(addressId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.addresses = this.addresses.filter(a => a.id !== addressId);
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = this.i18n.translate('addresses.deleteFailed');
        this.cdr.markForCheck();
      }
    });
  }

  setDefault(addressId: string): void {
    this.profileAddressService.setDefaultShipping(addressId).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: updated => {
        this.addresses = this.addresses.map(a => ({ ...a, defaultShipping: a.id === updated.id }));
        this.cdr.markForCheck();
      },
      error: () => {
        this.errorMessage = this.i18n.translate('addresses.setDefaultFailed');
        this.cdr.markForCheck();
      }
    });
  }
}

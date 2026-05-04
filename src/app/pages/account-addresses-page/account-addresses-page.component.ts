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
import { CepLookupService } from '../../core/commerce/services/cep-lookup.service';
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

  cepLookupPending = false;
  cepLookupFailed = false;

  readonly form = this.fb.group({
    label: [''],
    fullName: ['', Validators.required],
    postalCode: ['', Validators.required],
    line1: ['', Validators.required],
    number: ['', Validators.required],
    complement: [''],
    neighborhood: ['', Validators.required],
    referencePoint: [''],
    city: ['', Validators.required],
    region: ['', Validators.required],
    countryIso: ['BR', Validators.required],
    phone: [''],
    recipientCpfCnpj: [''],
    recipientEmail: [''],
    notes: ['']
  });

  constructor(
    private readonly fb: UntypedFormBuilder,
    private readonly profileAddressService: ProfileAddressService,
    private readonly cepLookup: CepLookupService,
    private readonly cdr: ChangeDetectorRef,
    readonly i18n: JuliI18nService
  ) {}

  /**
   * Disparado pelo (blur) do input postalCode. Auto-completa logradouro,
   * bairro, cidade e UF via ViaCEP. Mantém campos editáveis caso o
   * usuário precise corrigir (CEP único de cidade pequena, condomínio
   * que ainda não está catalogado, etc.).
   */
  onCepBlur(): void {
    const raw = (this.form.value.postalCode ?? '') as string;
    const digits = raw.replace(/\D/g, '');
    if (digits.length !== 8) return;
    this.cepLookupPending = true;
    this.cepLookupFailed = false;
    this.cdr.markForCheck();
    this.cepLookup.lookup(digits).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(info => {
      this.cepLookupPending = false;
      if (!info) {
        this.cepLookupFailed = true;
      } else {
        this.form.patchValue({
          line1: info.street || this.form.value.line1,
          neighborhood: info.neighborhood || this.form.value.neighborhood,
          city: info.city || this.form.value.city,
          region: info.state || this.form.value.region,
          countryIso: 'BR'
        }, { emitEvent: false });
      }
      this.cdr.markForCheck();
    });
  }

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
      label: v.label || undefined,
      fullName: v.fullName,
      line1: v.line1,
      line2: undefined,
      number: v.number,
      complement: v.complement || undefined,
      neighborhood: v.neighborhood,
      referencePoint: v.referencePoint || undefined,
      recipientCpfCnpj: v.recipientCpfCnpj || undefined,
      recipientEmail: v.recipientEmail || undefined,
      city: v.city,
      region: v.region,
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

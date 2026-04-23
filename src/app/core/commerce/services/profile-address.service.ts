import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { GatewayEnvelope, JuliSavedAddress } from '../models/ubris-commerce.models';

@Injectable({ providedIn: 'root' })
export class ProfileAddressService {
  constructor(private readonly http: HttpClient) {}

  listAddresses(): Observable<JuliSavedAddress[]> {
    return this.http
      .get<GatewayEnvelope<JuliSavedAddress[]>>(`${environment.ubrisApiBaseUrl}/api/bff/profile/addresses`)
      .pipe(map(r => (r.data as JuliSavedAddress[]) ?? []));
  }

  addAddress(address: Omit<JuliSavedAddress, 'id' | 'defaultShipping'>): Observable<JuliSavedAddress> {
    return this.http
      .post<GatewayEnvelope<JuliSavedAddress>>(`${environment.ubrisApiBaseUrl}/api/bff/profile/addresses`, address)
      .pipe(map(r => r.data as JuliSavedAddress));
  }

  deleteAddress(addressId: string): Observable<void> {
    return this.http
      .delete<void>(`${environment.ubrisApiBaseUrl}/api/bff/profile/addresses/${encodeURIComponent(addressId)}`);
  }

  setDefaultShipping(addressId: string): Observable<JuliSavedAddress> {
    return this.http
      .patch<GatewayEnvelope<JuliSavedAddress>>(
        `${environment.ubrisApiBaseUrl}/api/bff/profile/addresses/${encodeURIComponent(addressId)}/default-shipping`,
        {}
      )
      .pipe(map(r => r.data as JuliSavedAddress));
  }
}

import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { GatewayEnvelope, UbrisStorefrontList } from '../models/ubris-commerce.models';

@Injectable({ providedIn: 'root' })
export class UbrisCategoryAdapter {
  constructor(private readonly http: HttpClient) {}

  get(code: string, page: number, size: number, sort?: string): Observable<GatewayEnvelope<UbrisStorefrontList<Record<string, unknown>>>> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size));
    if (sort) {
      params = params.set('sort', sort);
    }

    return this.http.get<GatewayEnvelope<UbrisStorefrontList<Record<string, unknown>>>>(
      `${environment.ubrisApiBaseUrl}/api/storefront/category/${encodeURIComponent(code)}`,
      { params }
    );
  }
}

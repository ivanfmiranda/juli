import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

/**
 * Wire-shape of `GET /api/bff/me/approvals/pending` — items live behind
 * `requireApprover(jwt)` upstream so the storefront only renders this
 * for buyers whose B2B assignment carries an approver role.
 */
export interface ApprovalRequestRow {
  checkoutId: string;
  resourceType?: string;
  resourceId?: string;
  amount?: number | string;
  status?: string;
  companyId?: string;
  unitId?: string;
  requesterUsername?: string;
  currentLevel?: number;
  totalLevels?: number;
  createdAt?: string;
}

interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  message?: string | null;
}

@Injectable({ providedIn: 'root' })
export class JuliApprovalsInboxService {
  constructor(private readonly http: HttpClient) {}

  pending(): Observable<ApprovalRequestRow[]> {
    return this.http
      .get<ApiResponse<ApprovalRequestRow[]>>(`${environment.ubrisApiBaseUrl}/api/bff/me/approvals/pending`)
      .pipe(map(response => response?.data ?? []));
  }

  approve(checkoutId: string, comment?: string): Observable<unknown> {
    return this.http.post(
      `${environment.ubrisApiBaseUrl}/api/bff/approvals/${encodeURIComponent(checkoutId)}/approve`,
      comment ? { comment } : {}
    );
  }

  reject(checkoutId: string, comment?: string): Observable<unknown> {
    return this.http.post(
      `${environment.ubrisApiBaseUrl}/api/bff/approvals/${encodeURIComponent(checkoutId)}/reject`,
      comment ? { comment } : {}
    );
  }
}

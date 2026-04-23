/**
 * Returns Page Component
 *
 * Página de devolução/RMA do JULI.
 *
 * Features:
 * - Lista de solicitações de devolução
 * - Formulário para nova solicitação
 * - i18n completo
 * - Responsivo
 */

import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from '../../core/auth/auth.service';
import { Router } from '@angular/router';
import { JuliI18nService } from '../../core/i18n/i18n.service';

interface ReturnRequest {
  orderId: string;
  items: string[];
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  createdAt: string;
}

@Component({
  selector: 'app-returns-page',
  templateUrl: './returns-page.component.html',
  styleUrls: ['./returns-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReturnsPageComponent implements OnInit {
  readonly isLoggedIn$: Observable<boolean> = this.authService.session$.pipe(
    map(session => !!session)
  );

  returnRequests: ReturnRequest[] = [];
  showForm = false;
  orderId = '';
  reason = '';
  loading = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly i18n: JuliI18nService
  ) {}

  ngOnInit(): void {
    // Load return requests via service (to be wired when backend is ready)
    this.returnRequests = [];
  }

  openForm(): void {
    this.showForm = true;
  }

  submitReturn(): void {
    if (!this.orderId.trim()) return;
    // Submit to backend API (placeholder)
    this.showForm = false;
    this.orderId = '';
    this.reason = '';
  }

  cancelForm(): void {
    this.showForm = false;
  }

  t(key: string): string {
    return this.i18n.t(key);
  }
}

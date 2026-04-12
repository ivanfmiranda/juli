import { Injectable } from '@angular/core';
import { TenantHostService } from '../../services/tenant-host.service';

@Injectable({ providedIn: 'root' })
export class JuliCartIdStorageService {
  private readonly prefix = 'juli.cart';

  constructor(private readonly tenantHost: TenantHostService) {}

  read(userId: string): string | null {
    return localStorage.getItem(this.key(userId));
  }

  write(userId: string, cartId: string): void {
    localStorage.setItem(this.key(userId), cartId);
  }

  clear(userId: string): void {
    localStorage.removeItem(this.key(userId));
  }

  private key(userId: string): string {
    const tenant = this.tenantHost.currentTenantId();
    return `${this.prefix}.${tenant}.${userId}`;
  }
}

import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class JuliCartIdStorageService {
  private readonly prefix = 'juli.cart';

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
    return `${this.prefix}.${userId}`;
  }
}

import { Injectable } from '@angular/core';

/**
 * Anonymous cart storage with signed token support.
 * 
 * The token format is: base64Url(payload).signature
 * Payload: version.anonymousId.timestamp.random
 * 
 * This provides security against:
 * - Cart enumeration attacks (can't guess valid tokens)
 * - Cart hijacking (token is signed)
 * - Token tampering (signature validation)
 */
export interface AnonymousCartStorage {
  /** The anonymous token (signed, contains anonymousId) */
  anonymousToken: string;
  /** Anonymous principal id used by backend-agnostic cart flows */
  anonymousId: string;
  /** The cart ID from the server */
  cartId: string;
  /** When the cart was created */
  createdAt: string;
  /** Token expiration timestamp */
  expiresAt: string;
}

@Injectable({ providedIn: 'root' })
export class AnonymousCartStorageService {
  private readonly storageKey = 'juli.anon.cart';
  private readonly TOKEN_VERSION = 1;
  private readonly TOKEN_TTL_DAYS = 7;
  
  /** BroadcastChannel for cross-tab synchronization */
  private broadcastChannel: BroadcastChannel | null = null;

  constructor() {
    // Initialize BroadcastChannel for cross-tab sync
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      this.broadcastChannel = new BroadcastChannel('juli_cart_sync');
      this.broadcastChannel.onmessage = (event) => {
        this.handleBroadcastMessage(event.data);
      };
    }
  }

  /**
   * Reads the anonymous cart from storage.
   * Returns null if token is expired.
   */
  read(): AnonymousCartStorage | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) {
        return null;
      }
      const storage = JSON.parse(data) as AnonymousCartStorage;
      
      // Check if token is expired
      if (storage.expiresAt && new Date(storage.expiresAt) < new Date()) {
        this.clear();
        return null;
      }
      
      return storage;
    } catch {
      return null;
    }
  }

  /**
   * Writes anonymous cart data to storage with a server-issued signed token.
   * @param anonymousId the anonymous principal ID
   * @param cartId the cart ID from the server
   * @param serverToken the HMAC-signed token issued by the server (required)
   */
  write(anonymousId: string, cartId: string, serverToken?: string): void {
    try {
      const token = serverToken ?? this.generateToken(anonymousId);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + this.TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
      
      const storage: AnonymousCartStorage = {
        anonymousToken: token,
        anonymousId,
        cartId,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
      };
      localStorage.setItem(this.storageKey, JSON.stringify(storage));
      
      // Notify other tabs
      this.broadcast({ type: 'CART_CREATED', cartId });
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Clears the anonymous cart from storage.
   */
  clear(): void {
    try {
      localStorage.removeItem(this.storageKey);
      // Notify other tabs
      this.broadcast({ type: 'CART_CLEARED' });
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  /**
   * Clears storage after cart promotion (login).
   * This is a special clear that also notifies other tabs of promotion.
   */
  clearAfterPromotion(): void {
    try {
      localStorage.removeItem(this.storageKey);
      // Notify other tabs that cart was promoted
      this.broadcast({ type: 'CART_PROMOTED' });
    } catch {
      // Silently fail if localStorage is not available
    }
  }

  exists(): boolean {
    return this.read() !== null;
  }

  /**
   * Gets the anonymous token (signed).
   * This is what should be sent to the server.
   */
  getAnonymousToken(): string | null {
    const storage = this.read();
    return storage?.anonymousToken ?? null;
  }

  /**
   * Gets the anonymous ID from the token (client-side extraction only).
   * For server-side operations, send the full token.
   */
  getAnonymousId(): string | null {
    const token = this.getAnonymousToken();
    if (!token) return null;
    return this.extractAnonymousIdFromToken(token);
  }

  getCartId(): string | null {
    const storage = this.read();
    return storage?.cartId ?? null;
  }

  /**
   * Generates a cryptographically secure anonymous ID.
   */
  generateAnonymousId(): string {
    const browserCrypto = typeof crypto !== 'undefined'
      ? (crypto as Crypto & { randomUUID?: () => string })
      : undefined;

    if (browserCrypto?.randomUUID) {
      return browserCrypto.randomUUID();
    }

    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
      const random = (Math.random() * 16) | 0;
      const value = char === 'x' ? random : (random & 0x3) | 0x8;
      return value.toString(16);
    });
  }

  /**
   * Generates a signed token for the anonymousId.
   * Note: In production, the signature should come from the server.
   * This client-side signing is for defense-in-depth only.
   */
  private generateToken(anonymousId: string): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const random = this.generateRandomPart();
    
    // Payload: version.anonymousId.timestamp.random
    const payload = `${this.TOKEN_VERSION}.${anonymousId}.${timestamp}.${random}`;
    const encodedPayload = this.base64UrlEncode(payload);
    
    // In production, the server signs the token.
    // Here we create a client-side signature for basic tampering detection.
    // The server will validate with its own secret.
    const signature = this.createClientSignature(encodedPayload);
    
    return `${encodedPayload}.${signature}`;
  }

  /**
   * Extracts anonymousId from token (client-side only, no validation).
   */
  private extractAnonymousIdFromToken(token: string): string | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return null;
      
      const payload = this.base64UrlDecode(parts[0]);
      const payloadParts = payload.split('.');
      if (payloadParts.length !== 4) return null;
      
      return payloadParts[1];
    } catch {
      return null;
    }
  }

  private generateRandomPart(): string {
    const array = new Uint8Array(8);
    const browserCrypto = typeof crypto !== 'undefined'
      ? (crypto as Crypto & { getRandomValues?: (buffer: Uint8Array) => Uint8Array })
      : undefined;

    if (browserCrypto?.getRandomValues) {
      browserCrypto.getRandomValues(array);
    } else {
      // Fallback
      for (let i = 0; i < 8; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
  }

  private base64UrlEncode(str: string): string {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  }

  private base64UrlDecode(str: string): string {
    // Restore padding
    const padding = 4 - (str.length % 4);
    if (padding !== 4) {
      str += '='.repeat(padding);
    }
    return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  }

  /**
   * Creates a client-side signature.
   * This is NOT for security (client can't keep secrets) but for basic integrity.
   * The server validates with its own HMAC secret.
   */
  private createClientSignature(data: string): string {
    // Simple hash for client-side integrity check
    // Server will use proper HMAC with secret key
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return this.base64UrlEncode(hash.toString());
  }

  /**
   * Broadcasts a message to other tabs.
   */
  private broadcast(message: { type: string; cartId?: string }): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
    }
  }

  /**
   * Handles broadcast messages from other tabs.
   */
  private handleBroadcastMessage(message: { type: string; cartId?: string }): void {
    switch (message.type) {
      case 'CART_PROMOTED':
        // Another tab promoted the cart, clear this tab's storage
        this.clear();
        // Reload page to reflect authenticated state
        window.location.reload();
        break;
      case 'CART_CLEARED':
        // Another tab cleared the cart
        this.clear();
        break;
    }
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface WishlistItem {
  id: string;
  sku: string;
  productCode: string;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly baseUrl = `${environment.ubrisApiBaseUrl}/api/catalog/wishlist`;

  private readonly itemsSubject = new BehaviorSubject<WishlistItem[]>([]);
  private readonly savedSkusSubject = new BehaviorSubject<Set<string>>(new Set());
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  readonly items$ = this.itemsSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  isSaved$(sku: string): Observable<boolean> {
    return this.savedSkusSubject.asObservable().pipe(
      map(skus => skus.has(sku))
    );
  }

  load(): void {
    this.loadingSubject.next(true);
    this.http.get<WishlistItem[]>(this.baseUrl).pipe(
      catchError(() => of([] as WishlistItem[]))
    ).subscribe(items => {
      this.itemsSubject.next(items);
      this.savedSkusSubject.next(new Set(items.map(i => i.sku)));
      this.loadingSubject.next(false);
    });
  }

  checkSku(sku: string): void {
    this.http.get<{ sku: string; saved: boolean }>(`${this.baseUrl}/check/${sku}`).pipe(
      catchError(() => of({ sku, saved: false }))
    ).subscribe(({ saved }) => {
      const skus = new Set(this.savedSkusSubject.value);
      if (saved) skus.add(sku); else skus.delete(sku);
      this.savedSkusSubject.next(skus);
    });
  }

  toggle(sku: string, productCode: string): Observable<unknown> {
    const saved = this.savedSkusSubject.value.has(sku);
    if (saved) {
      return this.remove(sku);
    }
    return this.add(sku, productCode);
  }

  add(sku: string, productCode: string): Observable<unknown> {
    return this.http.post(this.baseUrl, { sku, productCode }).pipe(
      tap(() => {
        const skus = new Set(this.savedSkusSubject.value);
        skus.add(sku);
        this.savedSkusSubject.next(skus);
      }),
      catchError(err => { throw err; })
    );
  }

  remove(sku: string): Observable<unknown> {
    return this.http.delete(`${this.baseUrl}/${sku}`).pipe(
      tap(() => {
        const skus = new Set(this.savedSkusSubject.value);
        skus.delete(sku);
        this.savedSkusSubject.next(skus);
        const items = this.itemsSubject.value.filter(i => i.sku !== sku);
        this.itemsSubject.next(items);
      }),
      catchError(err => { throw err; })
    );
  }
}

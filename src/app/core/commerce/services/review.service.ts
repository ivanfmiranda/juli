import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Review {
  id: string;
  sku: string;
  rating: number;
  title?: string;
  body?: string;
  createdAt: string;
}

export interface ReviewSummary {
  sku: string;
  averageRating: number;
  count: number;
  reviews: Review[];
}

export interface MyReviewStatus {
  exists: boolean;
  rating?: number;
  title?: string;
  body?: string;
}

export interface ReviewRequest {
  sku: string;
  rating: number;
  title?: string;
  body?: string;
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private readonly baseUrl = `${environment.ubrisApiBaseUrl}/api/catalog/reviews`;

  private readonly summarySubject = new BehaviorSubject<ReviewSummary | null>(null);
  private readonly myReviewSubject = new BehaviorSubject<MyReviewStatus | null>(null);
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);
  private readonly submitErrorSubject = new BehaviorSubject<string | null>(null);

  readonly summary$ = this.summarySubject.asObservable();
  readonly myReview$ = this.myReviewSubject.asObservable();
  readonly loading$ = this.loadingSubject.asObservable();
  readonly submitError$ = this.submitErrorSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  loadReviews(sku: string): void {
    this.loadingSubject.next(true);
    this.http.get<ReviewSummary>(`${this.baseUrl}/products/${sku}`).pipe(
      catchError(() => of({ sku, averageRating: 0, count: 0, reviews: [] }))
    ).subscribe(summary => {
      this.summarySubject.next(summary);
      this.loadingSubject.next(false);
    });
  }

  loadMyReview(sku: string): void {
    this.http.get<MyReviewStatus>(`${this.baseUrl}/me/${sku}`).pipe(
      catchError(() => of({ exists: false }))
    ).subscribe(status => this.myReviewSubject.next(status));
  }

  submitReview(req: ReviewRequest): Observable<unknown> {
    this.submitErrorSubject.next(null);
    return this.http.post(this.baseUrl, req).pipe(
      tap(() => this.loadReviews(req.sku)),
      catchError(err => {
        this.submitErrorSubject.next(err?.error?.message ?? 'error');
        throw err;
      })
    );
  }

  clear(): void {
    this.summarySubject.next(null);
    this.myReviewSubject.next(null);
    this.submitErrorSubject.next(null);
  }
}

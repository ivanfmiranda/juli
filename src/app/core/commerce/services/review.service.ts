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
  photoUrls?: string[];
  helpfulCount?: number;
  votedHelpful?: boolean;
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
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  photoUrls?: string[];
}

export interface ReviewRequest {
  sku: string;
  rating: number;
  title?: string;
  body?: string;
}

export interface ReviewSubmitResponse {
  id: string;
  sku: string;
  rating: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
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

  submitReview(req: ReviewRequest): Observable<ReviewSubmitResponse> {
    this.submitErrorSubject.next(null);
    return this.http.post<ReviewSubmitResponse>(this.baseUrl, req).pipe(
      tap(() => this.loadReviews(req.sku)),
      catchError(err => {
        this.submitErrorSubject.next(err?.error?.message ?? 'error');
        throw err;
      })
    );
  }

  uploadPhoto(reviewId: string, file: File): Observable<{ id: string; photoUrls: string[] }> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<{ id: string; photoUrls: string[] }>(
      `${this.baseUrl}/${reviewId}/photos`, form);
  }

  toggleHelpful(reviewId: string, voted: boolean):
      Observable<{ helpfulCount: number; votedHelpful: boolean }> {
    return this.http.post<{ helpfulCount: number; votedHelpful: boolean; id: string }>(
      `${this.baseUrl}/${reviewId}/helpful`, { voted });
  }

  /**
   * Optimistic local mutation of the cached summary so the helpful button
   * reflects the click instantly. The HTTP call still fires; if it fails
   * we re-fetch to roll back. Avoids the round-trip flicker that comes
   * from waiting for the BehaviorSubject to update.
   */
  patchHelpfulLocally(reviewId: string, voted: boolean, count: number): void {
    const current = this.summarySubject.getValue();
    if (!current) return;
    this.summarySubject.next({
      ...current,
      reviews: current.reviews.map(r => r.id === reviewId
        ? { ...r, votedHelpful: voted, helpfulCount: count }
        : r),
    });
  }

  clear(): void {
    this.summarySubject.next(null);
    this.myReviewSubject.next(null);
    this.submitErrorSubject.next(null);
  }
}

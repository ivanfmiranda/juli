import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { JuliProductService } from '../../../core/commerce';
import { ReviewService } from '../../../core/commerce/services/review.service';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-product-reviews-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="product-reviews" *ngIf="(product$ | async) as product">
      <ng-container *ngIf="reviewSummary$ | async as summary">
        <div class="reviews-header">
          <h2>{{ 'reviews.title' | juliTranslate }}</h2>
          <div class="reviews-aggregate" *ngIf="summary.count > 0">
            <span class="avg-rating">{{ summary.averageRating | number:'1.1-1' }}</span>
            <span class="stars">
              <span *ngFor="let filled of getStars(summary.averageRating)"
                    class="star" [class.filled]="filled">★</span>
            </span>
            <span class="review-count">{{ 'pdp.reviews' | juliTranslate:{ count: summary.count } }}</span>
          </div>
        </div>

        <div class="review-cta" *ngIf="!reviewFormVisible">
          <ng-container *ngIf="auth.isAuthenticated; else loginToReview">
            <ng-container *ngIf="(myReview$ | async) as myStatus">
              <button class="btn-secondary" (click)="openReviewForm()">
                {{ myStatus.exists ? ('reviews.editReview' | juliTranslate) : ('reviews.writeReview' | juliTranslate) }}
              </button>
            </ng-container>
          </ng-container>
          <ng-template #loginToReview>
            <p class="review-login-hint">{{ 'reviews.loginToReview' | juliTranslate }}</p>
          </ng-template>
        </div>

        <div class="review-success" *ngIf="reviewSuccess">
          {{ 'reviews.successMessage' | juliTranslate }}
        </div>

        <div class="review-form" *ngIf="reviewFormVisible">
          <h3>{{ 'reviews.writeReview' | juliTranslate }}</h3>
          <div class="rating-picker">
            <label>{{ 'reviews.yourRating' | juliTranslate }}</label>
            <span *ngFor="let i of [1,2,3,4,5]"
                  class="star-pick" [class.active]="i <= reviewRating"
                  (click)="setReviewRating(i)">★</span>
          </div>
          <div class="form-field">
            <label>{{ 'reviews.titleLabel' | juliTranslate }}</label>
            <input type="text" [(ngModel)]="reviewTitle"
                   [placeholder]="'reviews.titlePlaceholder' | juliTranslate">
          </div>
          <div class="form-field">
            <label>{{ 'reviews.bodyLabel' | juliTranslate }}</label>
            <textarea rows="4" [(ngModel)]="reviewBody"
                      [placeholder]="'reviews.bodyPlaceholder' | juliTranslate"></textarea>
          </div>
          <div class="form-actions">
            <button class="btn-primary" [disabled]="reviewSubmitting"
                    (click)="submitReview(product.code)">
              {{ reviewSubmitting ? ('reviews.submitting' | juliTranslate) : ('reviews.submit' | juliTranslate) }}
            </button>
            <button class="btn-link" (click)="reviewFormVisible = false">{{ 'pdp.goBack' | juliTranslate }}</button>
          </div>
          <div class="review-error" *ngIf="reviewSubmitError$ | async as err">
            {{ 'reviews.errorMessage' | juliTranslate }}
          </div>
        </div>

        <div class="review-list" *ngIf="summary.reviews.length; else noReviews">
          <div class="review-item" *ngFor="let review of summary.reviews">
            <div class="review-stars">
              <span *ngFor="let filled of getStars(review.rating)"
                    class="star" [class.filled]="filled">★</span>
            </div>
            <p class="review-title" *ngIf="review.title"><strong>{{ review.title }}</strong></p>
            <p class="review-body" *ngIf="review.body">{{ review.body }}</p>
            <span class="review-date">{{ review.createdAt | date:'mediumDate' }}</span>
          </div>
        </div>
        <ng-template #noReviews>
          <p class="no-reviews">{{ 'reviews.noReviews' | juliTranslate }}</p>
          <p class="be-first">{{ 'reviews.beFirst' | juliTranslate }}</p>
        </ng-template>
      </ng-container>
    </section>
  `,
  styleUrls: ['../../product-detail/product-detail.component.scss'],
})
export class ProductReviewsBlockComponent implements OnInit {
  @Input() props: any = {};
  private readonly destroyRef = inject(DestroyRef);

  readonly product$ = this.juliProductService.detail$;
  readonly reviewSummary$ = this.reviewService.summary$;
  readonly myReview$ = this.reviewService.myReview$;
  readonly reviewSubmitError$ = this.reviewService.submitError$;

  reviewFormVisible = false;
  reviewRating = 5;
  reviewTitle = '';
  reviewBody = '';
  reviewSubmitting = false;
  reviewSuccess = false;

  constructor(
    private readonly juliProductService: JuliProductService,
    readonly reviewService: ReviewService,
    readonly auth: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.product$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(product => {
      if (product?.code) {
        this.reviewService.loadReviews(product.code);
        if (this.auth.isAuthenticated) this.reviewService.loadMyReview(product.code);
      }
      this.cdr.markForCheck();
    });
  }

  openReviewForm(): void {
    if (!this.auth.isAuthenticated) { this.router.navigate(['/login']); return; }
    this.reviewFormVisible = true;
    this.reviewSuccess = false;
    this.cdr.markForCheck();
  }

  setReviewRating(rating: number): void { this.reviewRating = rating; this.cdr.markForCheck(); }

  submitReview(sku: string): void {
    if (this.reviewSubmitting) return;
    this.reviewSubmitting = true;
    this.reviewSuccess = false;
    this.cdr.markForCheck();
    this.reviewService.submitReview({
      sku,
      rating: this.reviewRating,
      title: this.reviewTitle,
      body: this.reviewBody,
    }).subscribe({
      next: () => {
        this.reviewSubmitting = false;
        this.reviewSuccess = true;
        this.reviewFormVisible = false;
        this.reviewTitle = '';
        this.reviewBody = '';
        this.cdr.markForCheck();
      },
      error: () => { this.reviewSubmitting = false; this.cdr.markForCheck(); },
    });
  }

  getStars(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map(i => i <= Math.floor(rating));
  }
}

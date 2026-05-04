import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { JuliProductService } from '../../../core/commerce';
import { Review, ReviewService } from '../../../core/commerce/services/review.service';
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
              <span *ngIf="myStatus.exists && myStatus.status === 'PENDING'"
                    class="review-status-badge pending">
                {{ 'reviews.statusPending' | juliTranslate }}
              </span>
              <span *ngIf="myStatus.exists && myStatus.status === 'REJECTED'"
                    class="review-status-badge rejected">
                {{ 'reviews.statusRejected' | juliTranslate }}
              </span>
            </ng-container>
          </ng-container>
          <ng-template #loginToReview>
            <p class="review-login-hint">{{ 'reviews.loginToReview' | juliTranslate }}</p>
          </ng-template>
        </div>

        <div class="review-success" *ngIf="reviewSuccess">
          {{ 'reviews.successPendingMessage' | juliTranslate }}
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
          <div class="form-field photos-field">
            <label>{{ 'reviews.photosLabel' | juliTranslate }}</label>
            <div class="photo-thumbs">
              <div class="photo-thumb" *ngFor="let url of pendingPhotos">
                <img [src]="url" alt="">
              </div>
              <label class="photo-add" *ngIf="pendingPhotos.length < 5">
                <input type="file" accept="image/jpeg,image/png,image/webp"
                       (change)="onPhotoFile($event)" hidden>
                +
              </label>
            </div>
            <span class="photo-hint">{{ 'reviews.photosHint' | juliTranslate }}</span>
            <span class="photo-error" *ngIf="photoError">{{ photoError }}</span>
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
            <div class="review-photos" *ngIf="review.photoUrls?.length">
              <a *ngFor="let url of review.photoUrls" [href]="url" target="_blank" rel="noopener">
                <img [src]="url" alt="" loading="lazy">
              </a>
            </div>
            <div class="review-footer">
              <span class="review-date">{{ review.createdAt | date:'mediumDate' }}</span>
              <button class="btn-helpful"
                      [class.voted]="review.votedHelpful"
                      [disabled]="!auth.isAuthenticated"
                      (click)="onHelpfulClick(review)">
                👍 {{ 'reviews.helpful' | juliTranslate }}
                <span class="helpful-count" *ngIf="(review.helpfulCount || 0) > 0">
                  ({{ review.helpfulCount }})
                </span>
              </button>
            </div>
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
  pendingPhotos: string[] = [];
  pendingFiles: File[] = [];
  photoError: string | null = null;

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
    this.pendingPhotos = [];
    this.pendingFiles = [];
    this.photoError = null;
    this.cdr.markForCheck();
  }

  setReviewRating(rating: number): void { this.reviewRating = rating; this.cdr.markForCheck(); }

  onPhotoFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.photoError = null;
    if (this.pendingPhotos.length >= 5) {
      this.photoError = 'reviews.photoLimitReached';
      this.cdr.markForCheck();
      return;
    }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      this.photoError = 'reviews.photoInvalidType';
      this.cdr.markForCheck();
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.photoError = 'reviews.photoTooLarge';
      this.cdr.markForCheck();
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        this.pendingPhotos = [...this.pendingPhotos, reader.result];
        this.pendingFiles = [...this.pendingFiles, file];
        this.cdr.markForCheck();
      }
    };
    reader.readAsDataURL(file);
  }

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
      next: response => {
        // Photos are uploaded sequentially after the review row exists,
        // since the back-end ties each upload to the review id. The
        // submit response carries the id even for first-time creations.
        const reviewId = response.id;
        const uploads = this.pendingFiles.map(file =>
          this.reviewService.uploadPhoto(reviewId, file).toPromise());
        Promise.all(uploads).finally(() => {
          this.reviewSubmitting = false;
          this.reviewSuccess = true;
          this.reviewFormVisible = false;
          this.reviewTitle = '';
          this.reviewBody = '';
          this.pendingPhotos = [];
          this.pendingFiles = [];
          this.reviewService.loadReviews(sku);
          this.cdr.markForCheck();
        });
      },
      error: () => { this.reviewSubmitting = false; this.cdr.markForCheck(); },
    });
  }

  onHelpfulClick(review: Review): void {
    if (!this.auth.isAuthenticated) {
      this.router.navigate(['/login']);
      return;
    }
    const next = !review.votedHelpful;
    const nextCount = (review.helpfulCount || 0) + (next ? 1 : -1);
    // Optimistic update — mutate the BehaviorSubject snapshot so the
    // button toggles instantly. Roll back via a re-fetch on error.
    this.reviewService.patchHelpfulLocally(review.id, next, Math.max(0, nextCount));
    this.reviewService.toggleHelpful(review.id, next).subscribe({
      error: () => this.reviewService.loadReviews(review.sku),
    });
  }

  getStars(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map(i => i <= Math.floor(rating));
  }
}

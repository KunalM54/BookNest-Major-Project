import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../services/auth';
import { Book, BookService } from '../../../services/book';
import { BorrowService } from '../../../services/borrow';
import { Review, ReviewService } from '../../../services/review';
import { SnackbarService } from '../../../services/snackbar';

@Component({
  selector: 'app-book-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './book-detail.html',
  styleUrls: ['./book-detail.css'],
})
export class BookDetailComponent implements OnInit, OnDestroy {
  loading = false;
  submittingReview = false;

  book: Book | null = null;
  bookNotFound = false;

  hasPendingRequest = false;
  hasActiveBorrow = false;

  averageRating = 0;
  totalReviews = 0;
  reviews: Review[] = [];

  canWriteReview = false;
  hasExistingReview = false;

  reviewRating = 5;
  reviewComment = '';
  reviewError = '';

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private bookService: BookService,
    private borrowService: BorrowService,
    private reviewService: ReviewService,
    private snackbar: SnackbarService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      const idParam = params.get('id');
      const id = idParam ? Number(idParam) : NaN;
      if (!idParam || Number.isNaN(id) || id <= 0) {
        this.bookNotFound = true;
        return;
      }
      this.loadBook(id);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadBook(bookId: number) {
    this.loading = true;
    this.bookNotFound = false;
    this.book = null;
    this.reviews = [];
    this.totalReviews = 0;
    this.averageRating = 0;

    this.bookService.getBookById(bookId).subscribe({
      next: (book) => {
        this.book = {
          ...book,
          imageData: book.imageData ?? null,
        };
        this.loading = false;

        this.loadBorrowStatus();
        this.loadReviews();
        this.loadEligibility();
      },
      error: () => {
        this.loading = false;
        this.bookNotFound = true;
      },
    });
  }

  private loadBorrowStatus() {
    const userId = this.authService.getUserId();
    if (!userId || !this.book?.id) {
      this.hasPendingRequest = false;
      this.hasActiveBorrow = false;
      return;
    }

    this.borrowService.getBookBorrowStatus(userId, this.book.id).subscribe({
      next: (res) => {
        if (!res.success) return;
        this.hasPendingRequest = !!res.data?.hasPending;
        this.hasActiveBorrow = !!res.data?.hasActive;
      },
      error: () => {
        this.hasPendingRequest = false;
        this.hasActiveBorrow = false;
      },
    });
  }

  private loadReviews() {
    if (!this.book?.id) return;
    this.reviewService.getReviewsForBook(this.book.id).subscribe({
      next: (res) => {
        if (!res.success) return;
        this.averageRating = Number(res.data?.averageRating ?? 0);
        this.totalReviews = Number(res.data?.totalReviews ?? 0);
        this.reviews = res.data?.reviews ?? [];
      },
      error: () => {
        this.averageRating = 0;
        this.totalReviews = 0;
        this.reviews = [];
      },
    });
  }

  private loadEligibility() {
    const userId = this.authService.getUserId();
    if (!userId || !this.book?.id) {
      this.canWriteReview = false;
      this.hasExistingReview = false;
      return;
    }

    this.reviewService.checkEligibility(this.book.id, userId).subscribe({
      next: (res) => {
        if (!res.success) return;
        this.canWriteReview = !!res.data?.eligible;
        this.hasExistingReview = !!res.data?.hasExistingReview;

        if (res.data?.review) {
          this.reviewRating = res.data.review.rating ?? 5;
          this.reviewComment = res.data.review.comment ?? '';
        }
      },
      error: () => {
        this.canWriteReview = false;
        this.hasExistingReview = false;
      },
    });
  }

  isAvailable(): boolean {
    return (this.book?.availableCopies ?? 0) > 0;
  }

  get statusText(): string {
    if (!this.book) return '';
    if (this.isAvailable()) return 'Available';
    return 'Out of Stock';
  }

  get statusClass(): string {
    return this.isAvailable() ? 'available' : 'unavailable';
  }

  get borrowDisabledReason(): string | null {
    if (!this.book) return 'Book not loaded';
    if (!this.isAvailable()) return 'No copies available';
    if (this.hasActiveBorrow) return 'You already borrowed this book';
    if (this.hasPendingRequest) return 'Request already pending';
    return null;
  }

  requestBorrow() {
    if (!this.book?.id) return;

    const userId = this.authService.getUserId();
    if (!userId) {
      this.snackbar.show('Please login to request a book');
      this.router.navigate(['/login']);
      return;
    }

    if (this.borrowDisabledReason) {
      this.snackbar.show(this.borrowDisabledReason);
      return;
    }

    this.loading = true;
    this.borrowService.createRequest(userId, this.book.id).subscribe({
      next: (res) => {
        this.loading = false;
        if (res?.success) {
          this.snackbar.show(res.message || 'Request sent');
          this.hasPendingRequest = true;
          this.book = { ...this.book!, availableCopies: Math.max(0, (this.book!.availableCopies || 0) - 1) };
        } else {
          this.snackbar.show(res?.message || 'Failed to request book');
          this.loadBorrowStatus();
        }
      },
      error: (err) => {
        this.loading = false;
        this.snackbar.show(err?.error?.message || 'Failed to request book');
        this.loadBorrowStatus();
      },
    });
  }

  joinWaitlist() {
    this.snackbar.show('Waitlist feature will be added next (Reservation Queue).');
  }

  starArray(value: number): number[] {
    const v = Math.max(0, Math.min(5, Math.round(value)));
    return Array.from({ length: 5 }, (_, i) => (i < v ? 1 : 0));
  }

  submitReview() {
    this.reviewError = '';
    const userId = this.authService.getUserId();
    if (!userId || !this.book?.id) return;

    if (!this.canWriteReview) {
      this.reviewError = 'You can review only after returning this book.';
      return;
    }

    if (this.reviewRating < 1 || this.reviewRating > 5) {
      this.reviewError = 'Rating must be between 1 and 5.';
      return;
    }

    const comment = this.reviewComment?.trim() || null;
    if (comment && comment.length > 2000) {
      this.reviewError = 'Comment must be at most 2000 characters.';
      return;
    }

    this.submittingReview = true;
    this.reviewService.upsertReview(this.book.id, userId, { rating: this.reviewRating, comment }).subscribe({
      next: (res) => {
        this.submittingReview = false;
        if (res?.success) {
          this.snackbar.show(res.message || 'Review saved');
          this.hasExistingReview = true;
          this.loadReviews();
        } else {
          this.reviewError = res?.message || 'Failed to save review';
        }
      },
      error: (err) => {
        this.submittingReview = false;
        this.reviewError = err?.error?.message || 'Failed to save review';
      },
    });
  }
}


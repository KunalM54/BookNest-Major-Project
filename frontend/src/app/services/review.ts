import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Review {
  id: number;
  bookId: number;
  studentId: number;
  studentName: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
}

export interface ReviewsPayload {
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ReviewEligibilityPayload {
  eligible: boolean;
  hasExistingReview: boolean;
  review?: Review;
}

@Injectable({
  providedIn: 'root',
})
export class ReviewService {
  private apiUrl = 'http://localhost:8080/api/reviews';

  constructor(private http: HttpClient) {}

  getReviewsForBook(bookId: number): Observable<ApiResponse<ReviewsPayload>> {
    return this.http.get<ApiResponse<ReviewsPayload>>(`${this.apiUrl}/book/${bookId}`);
  }

  checkEligibility(bookId: number, studentId: number): Observable<ApiResponse<ReviewEligibilityPayload>> {
    return this.http.get<ApiResponse<ReviewEligibilityPayload>>(`${this.apiUrl}/eligibility`, {
      params: { bookId: bookId.toString(), studentId: studentId.toString() },
    });
  }

  upsertReview(
    bookId: number,
    studentId: number,
    payload: { rating: number; comment?: string | null }
  ): Observable<ApiResponse<Review>> {
    return this.http.post<ApiResponse<Review>>(`${this.apiUrl}/book/${bookId}`, payload, {
      params: { studentId: studentId.toString() },
    });
  }
}


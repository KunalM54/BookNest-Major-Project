import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { loadStripe, Stripe } from '@stripe/stripe-js';

export interface PaymentSessionResponse {
  success: boolean;
  message?: string;
  sessionId?: string;
  url?: string;
  orderId?: number;
  fineId?: number;
  amount?: number;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  message?: string;
  order?: any;
  fine?: any;
}

export interface Order {
  id: number;
  student: any;
  book: {
    id: number;
    title: string;
    author: string;
    price: number;
  };
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
  paidAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class StripePaymentService {
  private apiUrl = 'http://localhost:8080/api/payments';
  private stripePublishableKey = 'pk_test_REPLACE_WITH_YOUR_PUBLISHABLE_KEY';
  private stripe: Stripe | null = null;

  constructor(private http: HttpClient) {
    this.initStripe();
  }

  private async initStripe() {
    this.stripe = await loadStripe(this.stripePublishableKey);
  }

  createBookPurchaseSession(studentId: number, bookId: number): Observable<PaymentSessionResponse> {
    return this.http.post<PaymentSessionResponse>(
      `${this.apiUrl}/book/create-session`,
      null,
      { params: { studentId: studentId.toString(), bookId: bookId.toString() } }
    );
  }

  createFinePaymentSession(studentId: number, fineId: number): Observable<PaymentSessionResponse> {
    return this.http.post<PaymentSessionResponse>(
      `${this.apiUrl}/fine/create-session`,
      null,
      { params: { studentId: studentId.toString(), fineId: fineId.toString() } }
    );
  }

  confirmBookPurchase(sessionId: string): Observable<ConfirmPaymentResponse> {
    return this.http.get<ConfirmPaymentResponse>(
      `${this.apiUrl}/book/confirm`,
      { params: { sessionId } }
    );
  }

  confirmFinePayment(sessionId: string): Observable<ConfirmPaymentResponse> {
    return this.http.get<ConfirmPaymentResponse>(
      `${this.apiUrl}/fine/confirm`,
      { params: { sessionId } }
    );
  }

  getOrdersByStudent(studentId: number): Observable<{ success: boolean; data: Order[] }> {
    return this.http.get<{ success: boolean; data: Order[] }>(
      `${this.apiUrl}/orders/${studentId}`
    );
  }

  getOrderById(orderId: number): Observable<{ success: boolean; data?: Order }> {
    return this.http.get<{ success: boolean; data?: Order }>(
      `${this.apiUrl}/orders/details/${orderId}`
    );
  }

  async redirectToCheckout(url: string): Promise<void> {
    if (url) {
      window.location.href = url;
    }
  }

  updatePublishableKey(key: string) {
    this.stripePublishableKey = key;
    this.initStripe();
  }
}

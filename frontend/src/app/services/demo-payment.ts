import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface DemoOrderResponse {
  success: boolean;
  message?: string;
  orderId?: string;
  amount?: number;
  orderDbId?: number;
  fineId?: number;
  currency?: string;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
  bookTitle?: string;
  description?: string;
  paymentMode?: string;
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
    imageData?: string;
  };
  amount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'GIVEN' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  transactionId: string;
  createdAt: string;
  paidAt: string;
  givenAt?: string;
  studentName?: string;
  studentEmail?: string;
  studentPhone?: string;
}

@Injectable({
  providedIn: 'root'
})
export class DemoPaymentService {
  private apiUrl = 'http://localhost:8080/api/demo-payment';

  constructor(private http: HttpClient) {}

  createBookPurchaseOrder(studentId: number, bookId: number): Observable<DemoOrderResponse> {
    return this.http.post<DemoOrderResponse>(
      `${this.apiUrl}/book/create-order`,
      null,
      { params: { studentId: studentId.toString(), bookId: bookId.toString() } }
    );
  }

  createFinePaymentOrder(studentId: number, fineId: number): Observable<DemoOrderResponse> {
    return this.http.post<DemoOrderResponse>(
      `${this.apiUrl}/fine/create-order`,
      null,
      { params: { studentId: studentId.toString(), fineId: fineId.toString() } }
    );
  }

  verifyBookPayment(transactionId: string): Observable<ConfirmPaymentResponse> {
    return this.http.post<ConfirmPaymentResponse>(
      `${this.apiUrl}/book/verify`,
      null,
      { params: { transactionId } }
    );
  }

  verifyFinePayment(transactionId: string, fineId: number): Observable<ConfirmPaymentResponse> {
    return this.http.post<ConfirmPaymentResponse>(
      `${this.apiUrl}/fine/verify`,
      null,
      { params: { transactionId, fineId: fineId.toString() } }
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

  markAsGiven(orderId: number): Observable<{ success: boolean; message?: string; order?: Order }> {
    return this.http.post<{ success: boolean; message?: string; order?: Order }>(
      `${this.apiUrl}/admin/mark-given/${orderId}`,
      null
    );
  }

  cancelOrder(orderId?: number): Observable<{ success: boolean; message?: string }> {
    if (!orderId) {
      return new Observable(observer => {
        observer.next({ success: true, message: 'No order to cancel' });
        observer.complete();
      });
    }
    return this.http.delete<{ success: boolean; message?: string }>(
      `${this.apiUrl}/order/cancel/${orderId}`
    );
  }
}

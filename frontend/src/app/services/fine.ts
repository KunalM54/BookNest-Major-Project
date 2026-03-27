import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Fine {
  id: number;
  bookTitle?: string;
  bookAuthor?: string;
  dueDate?: string;
  returnDate?: string;
  lateDays: number;
  finePerDay: number;
  fineAmount: number;
  fineStatus: 'UNPAID' | 'PAID';
  paymentId?: number;
  createdAt?: string;
  borrowId?: number;
  studentName?: string;
  studentId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class FineService {
  private apiUrl = 'http://localhost:8080/api/fines';

  constructor(private http: HttpClient) {}

  getFinesByStudent(studentId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/student/${studentId}`);
  }

  getFineById(fineId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${fineId}`);
  }

  payFine(fineId: number, paymentId?: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pay/${fineId}`, { paymentId });
  }

  calculateFine(daysOverdue: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/calculate?daysOverdue=${daysOverdue}`);
  }

  calculateFineForBorrow(borrowId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/borrow/${borrowId}`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Fine {
  id: number;
  daysOverdue: number;
  fineAmount: number;
  finePerDay: number;
  paidAmount?: number;
  status: 'PENDING' | 'PAID';
  createdAt: string;
  paidAt?: string;
  paymentMethod?: string;
  borrow?: {
    id: number;
    book?: {
      id: number;
      title?: string;
      author?: string;
    };
    student?: {
      id: number;
      fullName?: string;
      studentId?: string;
    };
  };
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

  getAllFinesByStudent(studentId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/student/${studentId}/all`);
  }

  payFine(fineId: number, paymentMethod: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/pay/${fineId}`, { paymentMethod });
  }

  calculateFine(daysOverdue: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/calculate?daysOverdue=${daysOverdue}`);
  }

  calculateFineForBorrow(borrowId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/borrow/${borrowId}`);
  }

  calculateFinesForStudent(studentId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/student/${studentId}/calculate`);
  }
}

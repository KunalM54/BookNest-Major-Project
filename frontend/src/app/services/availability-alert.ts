import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AvailabilityAlert {
  id?: number;
  studentId: number;
  bookId: number;
  bookTitle?: string;
  isActive: boolean;
  notifiedAt?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class AvailabilityAlertService {
  private apiUrl = 'http://localhost:8080/api/alerts';

  constructor(private http: HttpClient) { }

  getAlerts(studentId: number): Observable<AvailabilityAlert[]> {
    return this.http.get<AvailabilityAlert[]>(`${this.apiUrl}?studentId=${studentId}`);
  }

  createAlert(studentId: number, bookId: number): Observable<ApiResponse<AvailabilityAlert>> {
    return this.http.post<ApiResponse<AvailabilityAlert>>(this.apiUrl, {}, {
      params: { studentId: studentId.toString(), bookId: bookId.toString() }
    });
  }

  removeAlert(alertId: number, studentId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${alertId}?studentId=${studentId}`);
  }
}

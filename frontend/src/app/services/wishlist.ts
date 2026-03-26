import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface WishlistItem {
  id: number;
  title: string;
  author: string;
  category: string;
  isbn: string;
  imageData?: string;
  availableCopies: number;
  price?: number;
  addedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class WishlistService {
  private apiUrl = 'http://localhost:8080/api/wishlist';

  constructor(private http: HttpClient) {}

  getWishlist(studentId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/student/${studentId}`);
  }

  addToWishlist(studentId: number, bookId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/add`, { studentId, bookId });
  }

  removeFromWishlist(studentId: number, bookId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/remove`, { body: { studentId, bookId } });
  }

  toggleWishlist(studentId: number, bookId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/toggle`, { studentId, bookId });
  }

  checkWishlist(studentId: number, bookId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/check/${studentId}/${bookId}`);
  }
}

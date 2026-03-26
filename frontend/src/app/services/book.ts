import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SpringPage } from './spring-page';

export interface Book {
  id?: number;
  title: string;
  isbn: string;
  author: string;
  category: string;
  imageData?: string | null;
  totalCopies: number;
  availableCopies: number;
  addedDate?: string;
  summary?: string;
  authorInfo?: string;
  price?: number;
}

@Injectable({
  providedIn: 'root',
})
export class BookService {
  private apiUrl = 'http://localhost:8080/api/books';

  constructor(private http: HttpClient) {}

  // Get all books
  getAllBooks(): Observable<Book[]> {
    return this.http.get<Book[]>(this.apiUrl);
  }

  // Get books (paged)
  getBooksPaged(page: number, size: number, sort?: string): Observable<SpringPage<Book>> {
    const sortQuery = sort ? `&sort=${encodeURIComponent(sort)}` : '';
    return this.http.get<SpringPage<Book>>(
      `${this.apiUrl}/paged?page=${page}&size=${size}${sortQuery}`
    );
  }

  // Get book by ID
  getBookById(id: number): Observable<Book> {
    return this.http.get<Book>(`${this.apiUrl}/${id}`);
  }

  // Add new book
  addBook(book: Book): Observable<any> {
    return this.http.post<any>(this.apiUrl, book);
  }

  // Update book
  updateBook(id: number, book: Book): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, book);
  }

  // Delete book
  deleteBook(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

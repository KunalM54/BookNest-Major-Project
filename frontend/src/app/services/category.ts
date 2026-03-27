import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Category {
  id?: number;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private apiUrl = 'http://localhost:8080/api/categories';

  constructor(private http: HttpClient) {}

  getAllCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  getActiveCategories(): Observable<Category[]> {
    const params = new HttpParams().set('activeOnly', 'true');
    return this.http.get<Category[]>(this.apiUrl, { params });
  }

  getCategoryById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createCategory(name: string, description?: string, displayOrder?: number): Observable<any> {
    let params = new HttpParams().set('name', name);
    if (description) {
      params = params.set('description', description);
    }
    if (displayOrder !== undefined) {
      params = params.set('displayOrder', displayOrder.toString());
    }
    return this.http.post<any>(this.apiUrl, params);
  }

  updateCategory(id: number, name?: string, description?: string, displayOrder?: number, isActive?: boolean): Observable<any> {
    let params = new HttpParams();
    if (name) params = params.set('name', name);
    if (description !== undefined) params = params.set('description', description);
    if (displayOrder !== undefined) params = params.set('displayOrder', displayOrder.toString());
    if (isActive !== undefined) params = params.set('isActive', isActive.toString());
    return this.http.put<any>(`${this.apiUrl}/${id}`, params);
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}

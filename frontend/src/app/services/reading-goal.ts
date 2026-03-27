import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ReadingGoal {
  id?: number;
  studentId?: number;
  goalType: string;
  targetBooks: number;
  currentProgress: number;
  startDate: string;
  endDate: string;
  isCompleted: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class ReadingGoalService {
  private apiUrl = 'http://localhost:8080/api/reading-goals';

  constructor(private http: HttpClient) { }

  getGoals(studentId: number): Observable<ReadingGoal[]> {
    return this.http.get<ReadingGoal[]>(`${this.apiUrl}?studentId=${studentId}`);
  }

  getActiveGoals(studentId: number): Observable<ReadingGoal[]> {
    return this.http.get<ReadingGoal[]>(`${this.apiUrl}/active?studentId=${studentId}`);
  }

  createGoal(studentId: number, goalType: string, targetBooks: number, 
             startDate: string, endDate: string): Observable<ApiResponse<ReadingGoal>> {
    return this.http.post<ApiResponse<ReadingGoal>>(this.apiUrl, {}, {
      params: { 
        studentId: studentId.toString(), 
        goalType, 
        targetBooks: targetBooks.toString(),
        startDate,
        endDate
      }
    });
  }

  updateProgress(goalId: number, studentId: number): Observable<ApiResponse<ReadingGoal>> {
    return this.http.put<ApiResponse<ReadingGoal>>(`${this.apiUrl}/${goalId}/progress?studentId=${studentId}`, {});
  }

  deleteGoal(goalId: number, studentId: number): Observable<ApiResponse<any>> {
    return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${goalId}?studentId=${studentId}`);
  }
}

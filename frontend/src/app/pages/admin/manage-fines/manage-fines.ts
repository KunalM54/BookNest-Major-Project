import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';

interface Fine {
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
      title: string;
      author: string;
    };
    student?: {
      id: number;
      fullName: string;
      email: string;
      studentId: string;
    };
  };
}

@Component({
  selector: 'app-manage-fines',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './manage-fines.html',
  styleUrls: ['./manage-fines.css']
})
export class ManageFinesComponent implements OnInit {
  fines: Fine[] = [];
  filteredFines: Fine[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';
  statusFilter = 'all';

  totalPending = 0;
  pendingCount = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadFines();
  }

  loadFines() {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<any>('http://localhost:8080/api/fines/admin/all').subscribe({
      next: (res) => {
        this.fines = res.data || [];
        this.totalPending = res.totalPending || 0;
        this.pendingCount = res.pendingCount || 0;
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load fines';
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    this.filteredFines = this.fines.filter(fine => {
      const matchesSearch = !this.searchTerm || 
        fine.borrow?.book?.title?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        fine.borrow?.student?.fullName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        fine.borrow?.student?.studentId?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesStatus = this.statusFilter === 'all' || 
        (this.statusFilter === 'pending' && fine.status === 'PENDING') ||
        (this.statusFilter === 'paid' && fine.status === 'PAID');

      return matchesSearch && matchesStatus;
    });
  }

  getStatusClass(status: string): string {
    return status === 'PENDING' ? 'pending' : 'paid';
  }

  getOutstanding(fine: Fine): number {
    const total = Number(fine.fineAmount || 0);
    const paid = Number(fine.paidAmount || 0);
    return Math.max(0, Math.round((total - paid) * 100) / 100);
  }

  get pendingFines() {
    return this.fines.filter(f => f.status === 'PENDING');
  }

  get paidFines() {
    return this.fines.filter(f => f.status === 'PAID');
  }
}

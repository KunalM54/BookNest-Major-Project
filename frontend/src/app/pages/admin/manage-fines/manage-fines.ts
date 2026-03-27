import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Fine {
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
  paidAmount?: number;
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
  totalPaid = 0;
  pendingCount = 0;
  paidCount = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadFines();
  }

  loadFines() {
    this.isLoading = true;
    this.errorMessage = '';

    this.http.get<any>('http://localhost:8080/api/admin/fines/all').subscribe({
      next: (res) => {
        if (res.success !== false) {
          this.fines = Array.isArray(res.data) ? res.data : [];
          this.totalPending = res.totalPending || 0;
          this.totalPaid = res.totalPaid || 0;
          this.pendingCount = res.pendingCount || 0;
          this.paidCount = res.paidCount || 0;
        } else {
          this.fines = [];
          this.errorMessage = res.message || 'Failed to load fines';
        }
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load fines';
        this.isLoading = false;
      }
    });
  }

  refreshFines() {
    this.loadFines();
  }

  applyFilters() {
    this.filteredFines = this.fines.filter(fine => {
      const matchesSearch = !this.searchTerm || 
        fine.bookTitle?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        fine.studentName?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        fine.studentId?.toLowerCase().includes(this.searchTerm.toLowerCase());

      const status = this.getStatus(fine);
      const matchesStatus = this.statusFilter === 'all' || 
        (this.statusFilter === 'paid' && status === 'Paid') ||
        (this.statusFilter === 'pending' && (status === 'Pending' || status === 'Overdue'));

      return matchesSearch && matchesStatus;
    });
  }

  getStatus(fine: Fine): string {
    const paid = fine.paidAmount ?? (fine.fineStatus === 'PAID' ? fine.fineAmount : 0);
    
    if (paid > 0 && paid >= fine.fineAmount) {
      return 'Paid';
    }
    
    if (fine.returnDate === null || fine.returnDate === undefined) {
      const dueDate = fine.dueDate ? new Date(fine.dueDate) : null;
      if (dueDate && dueDate < new Date()) {
        return 'Overdue';
      }
    }
    
    return 'Pending';
  }

  getStatusClass(fine: Fine): string {
    const status = this.getStatus(fine);
    if (status === 'Paid') return 'paid';
    if (status === 'Overdue') return 'overdue';
    return 'pending';
  }

  getPaidAmount(fine: Fine): number {
    return fine.paidAmount ?? (fine.fineStatus === 'PAID' ? fine.fineAmount : 0);
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
}

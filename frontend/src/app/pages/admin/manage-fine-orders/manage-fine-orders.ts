import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DemoPaymentService } from '../../../services/demo-payment';
import { SnackbarService } from '../../../services/snackbar';
import { ReceiptService } from '../../../services/receipt.service';

@Component({
  selector: 'app-manage-fine-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-container">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">
            <span class="material-icons page-icon">receipt_long</span>
            Fine Payments
          </h1>
          <p class="page-subtitle">View all fine payment records</p>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon pending">
            <span class="material-icons">hourglass_empty</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ totalFines }}</span>
            <span class="stat-label">Total Fines</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon paid">
            <span class="material-icons">check_circle</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ paidFines }}</span>
            <span class="stat-label">Paid</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon revenue">
            <span class="material-icons">account_balance_wallet</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">₹{{ totalRevenue | number: '1.0-0' }}</span>
            <span class="stat-label">Revenue</span>
          </div>
        </div>
      </div>

      <!-- Sticky Sub-header with Filters -->
      <div class="sub-header">
        <div class="filters-left">
          <div class="filter-tabs">
            <button class="filter-tab" [class.active]="activeTab === 'all'" (click)="setTab('all')">
              All
              <span class="badge">{{ fines.length }}</span>
            </button>
            <button class="filter-tab" [class.active]="activeTab === 'PENDING'" (click)="setTab('PENDING')">
              Pending
            </button>
            <button class="filter-tab" [class.active]="activeTab === 'PAID'" (click)="setTab('PAID')">
              Paid
            </button>
          </div>
        </div>
      </div>

      <!-- Data Table Card -->
      <div class="table-card">
        <div *ngIf="isLoading" class="loading-overlay">
          <div class="spinner"></div>
          <p>Loading fines...</p>
        </div>

        <table class="data-table" *ngIf="!isLoading">
          <thead>
            <tr>
              <th>Fine ID</th>
              <th>Student</th>
              <th>Book</th>
              <th>Days Late</th>
              <th>Amount</th>
              <th>Paid Amount</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let fine of filteredFines" class="table-row">
              <td>
                <span class="fine-id">#{{ fine.id }}</span>
              </td>
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ getInitials(fine.studentName) }}</div>
                  <div class="user-details">
                    <span class="user-name">{{ fine.studentName }}</span>
                    <span class="user-email">{{ fine.studentEmail }}</span>
                  </div>
                </div>
              </td>
              <td>
                <div class="book-cell">
                  <div class="book-icon">
                    <span class="material-icons">menu_book</span>
                  </div>
                  <div class="book-details">
                    <span class="book-title">{{ fine.bookTitle || 'N/A' }}</span>
                  </div>
                </div>
              </td>
              <td>
                <span class="days-late">{{ fine.daysOverdue }} days</span>
              </td>
              <td class="col-amount">
                <span class="amount-value">₹{{ fine.fineAmount }}</span>
              </td>
              <td>
                <span class="paid-amount">₹{{ fine.paidAmount || 0 }}</span>
              </td>
              <td class="col-date">
                <div class="date-cell">
                  <span>{{ fine.createdAt | date: 'MMM dd, yyyy' }}</span>
                </div>
              </td>
              <td class="col-status">
                <span class="status-pill" [ngClass]="getStatusClass(fine.status)">
                  {{ fine.status }}
                </span>
              </td>
            </tr>

            <!-- Empty State -->
            <tr *ngIf="filteredFines.length === 0" class="empty-row">
              <td colspan="8">
                <div class="empty-state">
                  <span class="material-icons empty-icon">account_balance_wallet</span>
                  <h3>No fines found</h3>
                  <p>Fine payment records will appear here.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  `,
  styles: [`
    /* Stats Row */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon .material-icons { font-size: 24px; }
    .stat-icon.pending { background: #fff3cd; color: #856404; }
    .stat-icon.paid { background: #d4edda; color: #28a745; }
    .stat-icon.revenue { background: #e8eaff; color: #667eea; }

    .stat-content { display: flex; flex-direction: column; }
    .stat-value { font-size: 24px; font-weight: bold; color: #333; }
    .stat-label { font-size: 13px; color: #666; }

    /* Sub Header */
    .sub-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: white;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .filter-tabs { display: flex; gap: 8px; }

    .filter-tab {
      padding: 8px 16px;
      border: none;
      background: transparent;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      color: #666;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-tab:hover { background: #f0f0f0; }
    .filter-tab.active { background: #667eea; color: white; }
    .filter-tab .badge {
      background: rgba(0,0,0,0.1);
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
    }
    .filter-tab.active .badge { background: rgba(255,255,255,0.2); }

    /* Table */
    .table-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .loading-overlay { padding: 60px; text-align: center; }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      background: #f8f9fa;
      padding: 14px 16px;
      text-align: left;
      font-weight: 600;
      color: #666;
      font-size: 13px;
      text-transform: uppercase;
      border-bottom: 1px solid #eee;
    }

    .data-table td {
      padding: 14px 16px;
      border-bottom: 1px solid #f0f0f0;
      vertical-align: middle;
    }

    .data-table tr:hover { background: #f8f9fa; }

    .fine-id { font-weight: 600; color: #667eea; }

    .user-cell { display: flex; align-items: center; gap: 12px; }

    .user-avatar {
      width: 40px;
      height: 40px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .user-details { display: flex; flex-direction: column; }
    .user-name { font-weight: 500; color: #333; }
    .user-email { font-size: 12px; color: #999; }

    .book-cell { display: flex; align-items: center; gap: 12px; }

    .book-icon {
      width: 40px;
      height: 40px;
      background: #fff3e0;
      color: #ff9800;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .book-icon .material-icons { font-size: 20px; }

    .book-details { display: flex; flex-direction: column; }
    .book-title { font-weight: 500; color: #333; max-width: 200px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .days-late { color: #dc3545; font-weight: 500; }

    .col-amount .amount-value { font-weight: 700; color: #667eea; font-size: 16px; }
    .paid-amount { color: #28a745; font-weight: 500; }

    .col-date .date-cell { display: flex; flex-direction: column; }

    .status-pill {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-pill.pending { background: #fff3cd; color: #856404; }
    .status-pill.paid { background: #d4edda; color: #155724; }

    .empty-row td { padding: 0 !important; }
    .empty-state { text-align: center; padding: 60px 20px; }
    .empty-icon { font-size: 80px; color: #ddd; margin-bottom: 20px; }
    .empty-state h3 { margin: 0 0 12px 0; color: #666; }
    .empty-state p { color: #999; margin: 0; }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .stats-row { grid-template-columns: repeat(2, 1fr); }
      .filter-tabs { flex-wrap: wrap; }
    }
  `]
})
export class ManageFineOrdersComponent implements OnInit {
  fines: any[] = [];
  filteredFines: any[] = [];
  isLoading = false;
  activeTab = 'all';

  constructor(
    private http: HttpClient,
    private snackbar: SnackbarService
  ) {}

  ngOnInit() {
    this.loadFines();
  }

  get totalFines(): number {
    return this.fines.length;
  }

  get paidFines(): number {
    return this.fines.filter(f => f.status === 'PAID').length;
  }

  get totalRevenue(): number {
    return this.fines
      .filter(f => f.status === 'PAID')
      .reduce((sum, f) => sum + (f.paidAmount || 0), 0);
  }

  loadFines() {
    this.isLoading = true;
    this.http.get<any>('http://localhost:8080/api/admin/fines/all').subscribe({
      next: (res) => {
        this.fines = res.data || [];
        this.filterFines();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackbar.show('Failed to load fines');
      }
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.filterFines();
  }

  filterFines() {
    if (this.activeTab === 'all') {
      this.filteredFines = [...this.fines];
    } else {
      this.filteredFines = this.fines.filter(f => f.status === this.activeTab);
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getStatusClass(status: string): string {
    return status === 'PAID' ? 'paid' : 'pending';
  }
}

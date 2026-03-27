import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DemoPaymentService } from '../../../services/demo-payment';
import { SnackbarService } from '../../../services/snackbar';
import { ReceiptService } from '../../../services/receipt.service';
import { GlobalSearchBarComponent } from '../../../components/global-search-bar/global-search-bar';

@Component({
  selector: 'app-manage-fine-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, GlobalSearchBarComponent],
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

      <!-- Sticky Sub-header with Search & Filters -->
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
        <app-global-search-bar 
          placeholder="Search student or book..." 
          [(value)]="searchTerm"
          (valueChange)="filterFines()">
        </app-global-search-bar>
      </div>

      <!-- Data Table Card -->
      <div class="table-card">
        <div *ngIf="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading fines...</p>
        </div>

        <table class="data-table" *ngIf="!isLoading">
          <thead>
            <tr>
              <th class="col-id">Fine ID</th>
              <th class="col-student">Student</th>
              <th class="col-book">Book</th>
              <th class="col-days">Days Late</th>
              <th class="col-amount">Amount</th>
              <th class="col-paid">Paid</th>
              <th class="col-date">Date</th>
              <th class="col-status">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let fine of filteredFines" class="table-row">
              <td class="col-id">
                <span class="fine-id">#{{ fine.id }}</span>
              </td>
              <td class="col-student">
                <div class="user-cell">
                  <div class="user-avatar">{{ getInitials(fine.studentName) }}</div>
                  <div class="user-details">
                    <span class="user-name">{{ fine.studentName }}</span>
                    <span class="user-id">{{ fine.studentEmail }}</span>
                  </div>
                </div>
              </td>
              <td class="col-book">
                <div class="book-cell">
                  <div class="book-icon">
                    <span class="material-icons">menu_book</span>
                  </div>
                  <div class="book-details">
                    <span class="book-title">{{ fine.bookTitle || 'N/A' }}</span>
                  </div>
                </div>
              </td>
              <td class="col-days">
                <span class="days-badge">{{ fine.daysOverdue }} days</span>
              </td>
              <td class="col-amount">
                <span class="amount-value">₹{{ fine.fineAmount }}</span>
              </td>
              <td class="col-paid">
                <span class="paid-value">₹{{ fine.paidAmount || 0 }}</span>
              </td>
              <td class="col-date">
                {{ fine.createdAt | date: 'MMM dd, yyyy' }}
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

        <!-- Table Footer -->
        <div class="table-footer" *ngIf="!isLoading && filteredFines.length > 0">
          <div class="footer-info">
            Showing <strong>{{ filteredFines.length }}</strong> of <strong>{{ fines.length }}</strong> fines
          </div>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* ===== BASE LAYOUT ===== */
    .page-container {
      padding: 0;
      max-width: 100%;
      background: #F8FAFC;
      min-height: calc(100vh - 56px);
    }

    /* ===== PAGE HEADER ===== */
    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.75rem;
      font-weight: 700;
      color: #1E293B;
      margin: 0;
      letter-spacing: -0.02em;
    }

    .page-icon {
      color: #D97706;
      font-size: 28px;
    }

    .page-subtitle {
      font-size: 0.9rem;
      color: #64748B;
      margin: 0;
      padding-left: 40px;
    }

    /* ===== STATS ROW ===== */
    .stats-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border: 1px solid #E2E8F0;
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon .material-icons {
      font-size: 24px;
    }

    .stat-icon.pending {
      background: #FEF3C7;
      color: #D97706;
    }

    .stat-icon.paid {
      background: #D1FAE5;
      color: #059669;
    }

    .stat-icon.revenue {
      background: #EDE9FE;
      color: #7C3AED;
    }

    .stat-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1E293B;
      line-height: 1;
    }

    .stat-label {
      font-size: 0.8rem;
      color: #64748B;
      font-weight: 500;
    }

    /* ===== STICKY SUB-HEADER ===== */
    .sub-header {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 16px;
      background: white;
      border-radius: 12px;
      margin-bottom: 20px;
      position: sticky;
      top: 8px;
      z-index: 100;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      border: 1px solid #E2E8F0;
    }

    .sub-header app-global-search-bar {
      margin-left: auto;
    }

    .filters-left {
      display: flex;
      align-items: center;
    }

    .filter-tabs {
      display: flex;
      gap: 4px;
      background: #F1F5F9;
      padding: 4px;
      border-radius: 10px;
    }

    .filter-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 16px;
      border: none;
      border-radius: 8px;
      background: transparent;
      font-size: 0.875rem;
      font-weight: 500;
      color: #64748B;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .filter-tab:hover {
      color: #1E293B;
      background: rgba(255, 255, 255, 0.5);
    }

    .filter-tab.active {
      background: white;
      color: #D97706;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .filter-tab .badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      border-radius: 10px;
      background: #EDE9FE;
      color: #7C3AED;
      font-size: 0.7rem;
      font-weight: 600;
    }

    .filter-tab.active .badge {
      background: #FEF3C7;
      color: #D97706;
    }

    /* ===== TABLE CARD ===== */
    .table-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      border: 1px solid #E2E8F0;
      overflow: hidden;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #F3F4F6;
      border-top-color: #D97706;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading-state p {
      font-size: 0.9rem;
      color: #64748B;
      margin: 0;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table thead {
      background: #F8FAFC;
    }

    .data-table th {
      padding: 14px 20px;
      font-size: 0.75rem;
      font-weight: 600;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      text-align: left;
      border-bottom: 1px solid #E2E8F0;
    }

    .data-table td {
      padding: 14px 20px;
      border-bottom: 1px solid #F1F5F9;
      font-size: 0.9rem;
      color: #334155;
      vertical-align: middle;
    }

    .table-row {
      transition: background 0.15s ease;
    }

    .table-row:hover {
      background: #F8FAFC;
    }

    .table-row:last-child td {
      border-bottom: none;
    }

    /* Column Widths */
    .col-id { width: 80px; }
    .col-student { min-width: 180px; }
    .col-book { min-width: 200px; }
    .col-days { width: 110px; }
    .col-amount { width: 120px; }
    .col-paid { width: 120px; }
    .col-date { width: 130px; }
    .col-status { width: 100px; }

    /* Fine ID */
    .fine-id {
      font-weight: 600;
      color: #7C3AED;
    }

    /* User Cell */
    .user-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 0.9rem;
      flex-shrink: 0;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .user-name {
      font-weight: 600;
      color: #1E293B;
    }

    .user-id {
      font-size: 0.8rem;
      color: #94A3B8;
    }

    /* Book Cell */
    .book-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .book-icon {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: #FEF3C7;
      color: #D97706;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .book-icon .material-icons {
      font-size: 18px;
    }

    .book-details {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .book-title {
      font-weight: 500;
      color: #1E293B;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Days Badge */
    .days-badge {
      display: inline-block;
      padding: 4px 10px;
      background: #FEE2E2;
      color: #DC2626;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* Amount */
    .amount-value {
      font-weight: 700;
      color: #7C3AED;
      font-size: 0.95rem;
    }

    .paid-value {
      color: #059669;
      font-weight: 500;
    }

    /* Date */
    .col-date {
      color: #64748B;
      font-size: 0.85rem;
    }

    /* Status Pill */
    .status-pill {
      display: inline-flex;
      align-items: center;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .status-pill.PENDING {
      background: #FEF3C7;
      color: #B45309;
    }

    .status-pill.PAID {
      background: #D1FAE5;
      color: #047857;
    }

    /* Empty State */
    .empty-row td {
      padding: 0;
      border: none;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
    }

    .empty-icon {
      font-size: 64px;
      color: #CBD5E1;
      margin-bottom: 16px;
    }

    .empty-state h3 {
      font-size: 1.1rem;
      font-weight: 600;
      color: #64748B;
      margin: 0 0 8px 0;
    }

    .empty-state p {
      font-size: 0.9rem;
      color: #94A3B8;
      margin: 0;
    }

    /* Table Footer */
    .table-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: #F8FAFC;
      border-top: 1px solid #E2E8F0;
    }

    .footer-info {
      font-size: 0.85rem;
      color: #64748B;
    }

    .footer-info strong {
      color: #1E293B;
    }

    /* ===== RESPONSIVE ===== */
    @media (max-width: 1200px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    @media (max-width: 1024px) {
      .sub-header {
        flex-direction: column;
        gap: 16px;
        align-items: stretch;
      }

      .filters-left {
        width: 100%;
      }

      .sub-header app-global-search-bar {
        margin-left: 0;
        width: 100%;
      }
    }

    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: 1fr;
      }

      .page-header {
        flex-direction: column;
        gap: 16px;
      }

      .data-table {
        display: block;
        overflow-x: auto;
      }

      .filter-tabs {
        overflow-x: auto;
      }
    }
  `]
})
export class ManageFineOrdersComponent implements OnInit {
  fines: any[] = [];
  filteredFines: any[] = [];
  isLoading = false;
  activeTab = 'all';
  searchTerm = '';

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
    let result = this.fines;
    
    if (this.activeTab !== 'all') {
      result = result.filter(f => f.status === this.activeTab);
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(f => 
        (f.studentName && f.studentName.toLowerCase().includes(term)) ||
        (f.studentEmail && f.studentEmail.toLowerCase().includes(term)) ||
        (f.bookTitle && f.bookTitle.toLowerCase().includes(term))
      );
    }
    
    this.filteredFines = result;
  }

  getInitials(name: string): string {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getStatusClass(status: string): string {
    return status === 'PAID' ? 'paid' : 'pending';
  }
}

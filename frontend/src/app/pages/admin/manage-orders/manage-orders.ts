import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DemoPaymentService, Order } from '../../../services/demo-payment';
import { SnackbarService } from '../../../services/snackbar';
import { ReceiptService } from '../../../services/receipt.service';
import { GlobalSearchBarComponent } from '../../../components/global-search-bar/global-search-bar';

@Component({
  selector: 'app-manage-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, GlobalSearchBarComponent],
  template: `
    <div class="page-container">

      <!-- Page Header -->
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">
            <span class="material-icons page-icon">shopping_cart</span>
            Book Orders
          </h1>
          <p class="page-subtitle">Manage book purchase orders from students</p>
        </div>
      </div>

      <!-- Stats Row -->
      <div class="stats-row">
        <div class="stat-card">
          <div class="stat-icon pending">
            <span class="material-icons">hourglass_empty</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ pendingCount }}</span>
            <span class="stat-label">Pending</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon completed">
            <span class="material-icons">check_circle</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ completedCount }}</span>
            <span class="stat-label">Ready to Give</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon issued">
            <span class="material-icons">local_shipping</span>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ givenCount }}</span>
            <span class="stat-label">Given</span>
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
              <span class="badge">{{ orders.length }}</span>
            </button>
            <button class="filter-tab" [class.active]="activeTab === 'PENDING'" (click)="setTab('PENDING')">
              Pending
              <span class="badge" *ngIf="pendingCount > 0">{{ pendingCount }}</span>
            </button>
            <button class="filter-tab" [class.active]="activeTab === 'COMPLETED'" (click)="setTab('COMPLETED')">
              Ready to Give
              <span class="badge" *ngIf="completedCount > 0">{{ completedCount }}</span>
            </button>
            <button class="filter-tab" [class.active]="activeTab === 'GIVEN'" (click)="setTab('GIVEN')">
              Given
            </button>
          </div>
        </div>
        <app-global-search-bar 
          placeholder="Search student or book..." 
          [(value)]="searchTerm"
          (valueChange)="filterOrders()">
        </app-global-search-bar>
      </div>

      <!-- Data Table Card -->
      <div class="table-card">
        <div *ngIf="isLoading" class="loading-state">
          <div class="spinner"></div>
          <p>Loading orders...</p>
        </div>

        <table class="data-table" *ngIf="!isLoading">
          <thead>
            <tr>
              <th class="col-student">Student</th>
              <th class="col-book">Book</th>
              <th class="col-amount">Amount</th>
              <th class="col-date">Order Date</th>
              <th class="col-status">Status</th>
              <th class="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of filteredOrders" class="table-row">

              <!-- Student -->
              <td class="col-student">
                <div class="user-cell">
                  <div class="user-avatar">{{ getInitials(order.student.fullName) }}</div>
                  <div class="user-details">
                    <span class="user-name">{{ order.student.fullName }}</span>
                    <span class="user-id">{{ order.student.email }}</span>
                  </div>
                </div>
              </td>

              <!-- Book -->
              <td class="col-book">
                <div class="book-cell">
                  <div class="book-icon">
                    <span class="material-icons">menu_book</span>
                  </div>
                  <div class="book-details">
                    <span class="book-title">{{ order.book.title }}</span>
                    <span class="book-author">by {{ order.book.author }}</span>
                  </div>
                </div>
              </td>

              <!-- Amount -->
              <td class="col-amount">
                <span class="amount-value">₹{{ order.amount }}</span>
              </td>

              <!-- Date -->
              <td class="col-date">
                <div class="date-cell">
                  <span>{{ order.createdAt | date: 'MMM dd, yyyy' }}</span>
                  <span class="time">{{ order.createdAt | date: 'HH:mm' }}</span>
                </div>
              </td>

              <!-- Status -->
              <td class="col-status">
                <span class="status-pill" [ngClass]="getStatusClass(order.status)">
                  {{ getStatusText(order.status) }}
                </span>
              </td>

              <!-- Actions -->
              <td class="col-actions">
                <div class="action-group">
                  <!-- Download Receipt: for all orders -->
                  <button class="action-btn download" (click)="downloadReceipt(order)" title="Download Receipt">
                    <span class="material-icons">download</span>
                  </button>

                  <!-- Issue Book: only for COMPLETED (Ready to Give) -->
                  <button *ngIf="order.status === 'COMPLETED'" class="action-btn issue" 
                    (click)="markAsGiven(order)" [disabled]="processingId === order.id"
                    title="Issue Book to Student">
                    <span class="material-icons" *ngIf="processingId !== order.id">check</span>
                    <span class="material-icons spinning" *ngIf="processingId === order.id">sync</span>
                  </button>

                  <!-- Verified: for GIVEN -->
                  <span *ngIf="order.status === 'GIVEN'" class="verified-badge" title="Book Given">
                    <span class="material-icons">verified</span>
                  </span>

                  <!-- Remove: for PENDING or FAILED -->
                  <button *ngIf="order.status === 'PENDING' || order.status === 'FAILED'" 
                    class="action-btn delete" (click)="removeOrder(order)" title="Remove">
                    <span class="material-icons">delete_outline</span>
                  </button>
                </div>
              </td>
            </tr>

            <!-- Empty State -->
            <tr *ngIf="filteredOrders.length === 0" class="empty-row">
              <td colspan="6">
                <div class="empty-state">
                  <span class="material-icons empty-icon">receipt_long</span>
                  <h3>No orders found</h3>
                  <p>Book purchase orders will appear here when students purchase books.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Table Footer -->
        <div class="table-footer" *ngIf="!isLoading && filteredOrders.length > 0">
          <div class="footer-info">
            Showing <strong>{{ filteredOrders.length }}</strong> of <strong>{{ orders.length }}</strong> orders
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
      color: #7C3AED;
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
      grid-template-columns: repeat(4, 1fr);
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

    .stat-icon.completed {
      background: #D1FAE5;
      color: #059669;
    }

    .stat-icon.issued {
      background: #DBEAFE;
      color: #2563EB;
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
      color: #7C3AED;
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
      background: #EDE9FE;
      color: #7C3AED;
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
      border-top-color: #7C3AED;
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
    .col-student { min-width: 180px; }
    .col-book { min-width: 220px; }
    .col-amount { width: 120px; }
    .col-date { width: 140px; }
    .col-status { width: 120px; }
    .col-actions { width: 140px; }

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
      background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
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
      background: #EDE9FE;
      color: #7C3AED;
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

    .book-author {
      font-size: 0.8rem;
      color: #94A3B8;
    }

    /* Amount */
    .amount-value {
      font-weight: 700;
      color: #7C3AED;
      font-size: 0.95rem;
    }

    /* Date */
    .date-cell {
      display: flex;
      flex-direction: column;
    }

    .date-cell .time {
      font-size: 0.8rem;
      color: #94A3B8;
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

    .status-pill.pending {
      background: #FEF3C7;
      color: #B45309;
    }

    .status-pill.completed {
      background: #D1FAE5;
      color: #047857;
    }

    .status-pill.given {
      background: #DBEAFE;
      color: #1D4ED8;
    }

    .status-pill.failed {
      background: #FEE2E2;
      color: #DC2626;
    }

    /* Actions */
    .action-group {
      display: flex;
      gap: 8px;
    }

    .action-btn {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .action-btn .material-icons {
      font-size: 18px;
    }

    .action-btn.download {
      background: #EDE9FE;
      color: #7C3AED;
    }

    .action-btn.download:hover {
      background: #7C3AED;
      color: white;
    }

    .action-btn.issue {
      background: #D1FAE5;
      color: #059669;
    }

    .action-btn.issue:hover {
      background: #059669;
      color: white;
    }

    .action-btn.delete {
      background: #FEE2E2;
      color: #DC2626;
    }

    .action-btn.delete:hover {
      background: #DC2626;
      color: white;
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .verified-badge {
      color: #059669;
      display: flex;
      align-items: center;
    }

    .verified-badge .material-icons {
      font-size: 24px;
    }

    .spinning {
      animation: spin 1s linear infinite;
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
export class ManageOrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = false;
  activeTab = 'all';
  searchTerm = '';
  
  processingId: number | null = null;

  constructor(
    private http: HttpClient,
    private demoPaymentService: DemoPaymentService,
    private snackbar: SnackbarService,
    private receiptService: ReceiptService
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  get pendingCount(): number {
    return this.orders.filter(o => o.status === 'PENDING').length;
  }

  get completedCount(): number {
    return this.orders.filter(o => o.status === 'COMPLETED').length;
  }

  get givenCount(): number {
    return this.orders.filter(o => o.status === 'GIVEN').length;
  }

  get totalRevenue(): number {
    return this.orders
      .filter(o => o.status === 'COMPLETED' || o.status === 'GIVEN')
      .reduce((sum, o) => sum + (o.amount || 0), 0);
  }

  loadOrders() {
    this.isLoading = true;
    this.http.get<any>('http://localhost:8080/api/demo-payment/admin/all').subscribe({
      next: (res) => {
        this.orders = res.data || [];
        this.filterOrders();
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackbar.show('Failed to load orders');
      }
    });
  }

  setTab(tab: string) {
    this.activeTab = tab;
    this.filterOrders();
  }

  filterOrders() {
    let result = this.orders;
    
    if (this.activeTab !== 'all') {
      result = result.filter(o => o.status === this.activeTab);
    }
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(o => 
        o.student.fullName.toLowerCase().includes(term) ||
        o.student.email.toLowerCase().includes(term) ||
        o.book.title.toLowerCase().includes(term)
      );
    }
    
    this.filteredOrders = result;
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'PENDING': return 'pending';
      case 'COMPLETED': return 'completed';
      case 'GIVEN': return 'given';
      case 'FAILED': return 'failed';
      default: return 'pending';
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'PENDING': return 'Pending';
      case 'COMPLETED': return 'Ready to Give';
      case 'GIVEN': return 'Given';
      case 'FAILED': return 'Failed';
      default: return status;
    }
  }

  downloadReceipt(order: Order) {
    this.receiptService.downloadReceipt({
      transactionId: order.transactionId,
      amount: order.amount,
      bookTitle: order.book.title,
      bookAuthor: order.book.author,
      studentName: order.student.fullName,
      studentEmail: order.student.email,
      date: new Date(order.createdAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      paymentMethod: order.paymentMethod || 'DEMO',
      orderId: order.id
    });
  }

  markAsGiven(order: Order) {
    if (this.processingId) return;
    
    this.processingId = order.id;
    console.log('Marking order as given:', order.id, 'Current status:', order.status);
    
    this.demoPaymentService.markAsGiven(order.id).subscribe({
      next: (res) => {
        console.log('Mark as given response:', res);
        if (res.success) {
          order.status = 'GIVEN';
          this.snackbar.show('Book issued to student successfully!');
          this.filterOrders();
        } else {
          this.snackbar.show(res.message || 'Failed to issue book');
        }
        this.processingId = null;
      },
      error: (err) => {
        console.error('Mark as given error:', err);
        this.processingId = null;
        this.snackbar.show(err?.error?.message || 'Failed to issue book - Check console');
      }
    });
  }

  removeOrder(order: Order) {
    if (confirm('Are you sure you want to remove this order?')) {
      this.orders = this.orders.filter(o => o.id !== order.id);
      this.filterOrders();
      this.snackbar.show('Order removed');
    }
  }
}

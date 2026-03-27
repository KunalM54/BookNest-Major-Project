import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DemoPaymentService, Order } from '../../../services/demo-payment';
import { SnackbarService } from '../../../services/snackbar';
import { ReceiptService } from '../../../services/receipt.service';

@Component({
  selector: 'app-manage-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

      <!-- Sticky Sub-header with Filters -->
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
      </div>

      <!-- Data Table Card -->
      <div class="table-card">
        <div *ngIf="isLoading" class="loading-overlay">
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
                    <span class="user-email">{{ order.student.email }}</span>
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

    .stat-icon .material-icons {
      font-size: 24px;
    }

    .stat-icon.pending { background: #fff3cd; color: #856404; }
    .stat-icon.completed { background: #d4edda; color: #28a745; }
    .stat-icon.issued { background: #cce5ff; color: #004085; }
    .stat-icon.revenue { background: #e8eaff; color: #667eea; }

    .stat-content {
      display: flex;
      flex-direction: column;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #333;
    }

    .stat-label {
      font-size: 13px;
      color: #666;
    }

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

    .filter-tabs {
      display: flex;
      gap: 8px;
    }

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

    .filter-tab:hover {
      background: #f0f0f0;
    }

    .filter-tab.active {
      background: #667eea;
      color: white;
    }

    .filter-tab .badge {
      background: rgba(0,0,0,0.1);
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 12px;
    }

    .filter-tab.active .badge {
      background: rgba(255,255,255,0.2);
    }

    /* Table */
    .table-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .loading-overlay {
      padding: 60px;
      text-align: center;
    }

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

    .data-table tr:hover {
      background: #f8f9fa;
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
    }

    .user-details {
      display: flex;
      flex-direction: column;
    }

    .user-name {
      font-weight: 500;
      color: #333;
    }

    .user-email {
      font-size: 12px;
      color: #999;
    }

    /* Book Cell */
    .book-cell {
      display: flex;
      align-items: center;
      gap: 12px;
    }

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

    .book-icon .material-icons {
      font-size: 20px;
    }

    .book-details {
      display: flex;
      flex-direction: column;
    }

    .book-title {
      font-weight: 500;
      color: #333;
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .book-author {
      font-size: 12px;
      color: #999;
    }

    /* Amount */
    .col-amount .amount-value {
      font-weight: 700;
      color: #667eea;
      font-size: 16px;
    }

    /* Date */
    .date-cell {
      display: flex;
      flex-direction: column;
    }

    .date-cell .time {
      font-size: 11px;
      color: #999;
    }

    /* Status Pill */
    .status-pill {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .status-pill.pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-pill.completed {
      background: #d4edda;
      color: #155724;
    }

    .status-pill.given {
      background: #cce5ff;
      color: #004085;
    }

    .status-pill.failed {
      background: #f8d7da;
      color: #721c24;
    }

    /* Actions */
    .action-group {
      display: flex;
      gap: 8px;
      align-items: center;
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
      transition: all 0.2s;
      background: #f0f0f0;
      color: #666;
    }

    .action-btn:hover {
      transform: translateY(-2px);
    }

    .action-btn.download {
      background: #e8eaff;
      color: #667eea;
    }

    .action-btn.download:hover {
      background: #667eea;
      color: white;
    }

    .action-btn.issue {
      background: #d4edda;
      color: #28a745;
    }

    .action-btn.issue:hover {
      background: #28a745;
      color: white;
    }

    .action-btn.delete {
      background: #f8d7da;
      color: #dc3545;
    }

    .action-btn.delete:hover {
      background: #dc3545;
      color: white;
    }

    .action-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .verified-badge {
      color: #28a745;
      display: flex;
      align-items: center;
    }

    .verified-badge .material-icons {
      font-size: 24px;
    }

    /* Empty State */
    .empty-row td {
      padding: 0 !important;
    }

    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-icon {
      font-size: 80px;
      color: #ddd;
      margin-bottom: 20px;
    }

    .empty-state h3 {
      margin: 0 0 12px 0;
      color: #666;
    }

    .empty-state p {
      color: #999;
      margin: 0;
    }

    /* Loading */
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

    .s spinning {
      animation: spin 1s linear infinite;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .stats-row {
        grid-template-columns: repeat(2, 1fr);
      }

      .filter-tabs {
        flex-wrap: wrap;
      }

      .col-book .book-author {
        display: none;
      }
    }
  `]
})
export class ManageOrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = false;
  activeTab = 'all';
  
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
    if (this.activeTab === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(o => o.status === this.activeTab);
    }
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

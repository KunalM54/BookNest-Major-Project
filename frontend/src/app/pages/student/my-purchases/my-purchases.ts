import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DemoPaymentService, Order } from '../../../services/demo-payment';
import { AuthService } from '../../../services/auth';
import { ReceiptService } from '../../../services/receipt.service';

@Component({
  selector: 'app-my-purchases',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="page-container">
      <div class="page-header">
        <div class="header-left">
          <h1 class="page-title">
            <span class="material-icons page-icon">shopping_bag</span>
            My Orders
          </h1>
          <p class="page-subtitle">Track your book purchases</p>
        </div>
      </div>

      <div *ngIf="isLoading" class="loading-state">
        <div class="spinner"></div>
        <p>Loading your orders...</p>
      </div>

      <div *ngIf="!isLoading && orders.length === 0" class="empty-state">
        <span class="material-icons empty-icon">shopping_bag</span>
        <h3>No orders yet</h3>
        <p>Books you purchase will appear here. Browse our library to find your next read!</p>
        <a routerLink="/student/browse" class="btn btn-primary">
          <span class="material-icons">search</span>
          Browse Books
        </a>
      </div>

      <div *ngIf="!isLoading && orders.length > 0" class="orders-container">
        <div class="orders-count">
          {{ orders.length }} order{{ orders.length !== 1 ? 's' : '' }}
        </div>

        <div class="order-item" *ngFor="let order of orders">
          <!-- Order Header -->
          <div class="order-header">
            <div class="order-meta">
              <span class="order-id">Order #{{ order.transactionId.substring(0, 20) }}</span>
              <span class="order-date">{{ order.createdAt | date: 'MMM dd, yyyy, HH:mm' }}</span>
            </div>
            <div class="order-status" [ngClass]="getStatusClass(order.status)">
              <span class="material-icons">{{ getStatusIcon(order.status) }}</span>
              {{ getStatusLabel(order.status) }}
            </div>
          </div>

          <!-- Order Body - Book Info -->
          <div class="order-body">
            <div class="book-info">
              <div class="book-icon">
                <span class="material-icons">menu_book</span>
              </div>
              <div class="book-details">
                <h3 class="book-title">{{ order.book.title }}</h3>
                <p class="book-author">by {{ order.book.author }}</p>
                <p class="book-price">₹{{ order.amount }}</p>
              </div>
            </div>

            <!-- Status Actions -->
            <div class="status-actions">
              <div class="action-notice" [ngClass]="getNoticeClass(order.status)">
                <span class="material-icons">{{ getNoticeIcon(order.status) }}</span>
                <span>{{ getNoticeText(order.status) }}</span>
              </div>
            </div>
          </div>

          <!-- Order Footer -->
          <div class="order-footer">
            <button class="btn-action receipt" (click)="downloadReceipt(order)">
              <span class="material-icons">receipt_long</span>
              {{ order.status === 'COMPLETED' ? 'Download Receipt' : 'View Receipt' }}
            </button>
            <button class="btn-action view" (click)="viewReceipt(order)">
              <span class="material-icons">visibility</span>
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Receipt Modal -->
    <div class="modal-overlay" *ngIf="showReceiptModal" (click)="closeReceiptModal()">
      <div class="modal-card" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Order Receipt</h3>
          <button class="close-btn" (click)="closeReceiptModal()">
            <span class="material-icons">close</span>
          </button>
        </div>
        <div class="modal-body" *ngIf="selectedOrder">
          <div class="receipt-content">
            <div class="receipt-header">
              <div class="logo">
                <span class="material-icons">local_library</span>
                <span>BookNest</span>
              </div>
              <span class="receipt-badge">RECEIPT</span>
            </div>

            <div class="receipt-info">
              <div class="info-row">
                <span class="label">Transaction ID</span>
                <span class="value">{{ selectedOrder.transactionId }}</span>
              </div>
              <div class="info-row">
                <span class="label">Date</span>
                <span class="value">{{ selectedOrder.createdAt | date: 'MMM dd, yyyy HH:mm' }}</span>
              </div>
            </div>

            <div class="book-section">
              <h4>Book Details</h4>
              <p class="book-title">{{ selectedOrder.book.title }}</p>
              <p class="book-author">by {{ selectedOrder.book.author }}</p>
            </div>

            <div class="total-section">
              <span>Amount Paid</span>
              <span class="amount">₹{{ selectedOrder.amount }}</span>
            </div>

            <div class="status-badge" [ngClass]="getStatusClass(selectedOrder.status)">
              <span class="material-icons">{{ getStatusIcon(selectedOrder.status) }}</span>
              {{ getStatusLabel(selectedOrder.status) }}
            </div>

            <div class="notice-section" [ngClass]="getNoticeClass(selectedOrder.status)">
              <span class="material-icons">{{ getNoticeIcon(selectedOrder.status) }}</span>
              <p>{{ getNoticeText(selectedOrder.status) }}</p>
            </div>
          </div>
        </div>
        <div class="modal-footer" *ngIf="selectedOrder">
          <button class="btn btn-primary" (click)="downloadReceipt(selectedOrder)">
            <span class="material-icons">download</span>
            Download Receipt
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders-container {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .orders-count {
      padding: 16px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
      font-weight: 600;
      color: #333;
    }

    .order-item {
      border-bottom: 1px solid #eee;
    }

    .order-item:last-child {
      border-bottom: none;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
    }

    .order-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .order-id {
      font-weight: 600;
      color: #333;
      font-size: 14px;
    }

    .order-date {
      font-size: 12px;
      color: #999;
    }

    .order-status {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .order-status .material-icons {
      font-size: 16px;
    }

    .order-status.pending {
      background: #fff3cd;
      color: #856404;
    }

    .order-status.completed {
      background: #d4edda;
      color: #155724;
    }

    .order-status.given {
      background: #cce5ff;
      color: #004085;
    }

    .order-body {
      padding: 20px;
      display: flex;
      gap: 20px;
      align-items: center;
    }

    .book-info {
      display: flex;
      gap: 16px;
      flex: 1;
    }

    .book-icon {
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .book-icon .material-icons {
      font-size: 28px;
    }

    .book-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .book-title {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }

    .book-author {
      margin: 0;
      font-size: 13px;
      color: #666;
    }

    .book-price {
      margin: 4px 0 0 0;
      font-size: 18px;
      font-weight: 700;
      color: #667eea;
    }

    .status-actions {
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-width: 250px;
    }

    .action-notice {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13px;
    }

    .action-notice.waiting {
      background: #fff3cd;
      color: #856404;
    }

    .action-notice.ready {
      background: #d4edda;
      color: #155724;
    }

    .action-notice.collected {
      background: #cce5ff;
      color: #004085;
    }

    .action-notice .material-icons {
      font-size: 20px;
      flex-shrink: 0;
    }

    .order-footer {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      background: #fafafa;
      border-top: 1px solid #eee;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid #ddd;
      background: white;
    }

    .btn-action .material-icons {
      font-size: 18px;
    }

    .btn-action.receipt {
      background: #667eea;
      color: white;
      border-color: #667eea;
    }

    .btn-action.receipt:hover {
      background: #5a6fd6;
    }

    .btn-action.view {
      color: #333;
    }

    .btn-action.view:hover {
      background: #f0f0f0;
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 12px;
    }

    .empty-icon {
      font-size: 100px;
      color: #ddd;
      margin-bottom: 24px;
    }

    .empty-state h3 {
      margin: 0 0 12px 0;
      color: #666;
      font-size: 24px;
    }

    .empty-state p {
      color: #999;
      margin: 0 0 24px 0;
      font-size: 16px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 28px;
      border-radius: 10px;
      font-weight: 600;
      font-size: 15px;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-primary:hover {
      background: #5a6fd6;
      transform: translateY(-2px);
    }

    .loading-state {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 12px;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 9999;
    }

    .modal-card {
      background: white;
      border-radius: 16px;
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 24px;
      border-bottom: 1px solid #eee;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 18px;
      color: #333;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #666;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f0f0f0;
      color: #333;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #eee;
    }

    .modal-footer .btn {
      width: 100%;
    }

    /* Receipt Styles */
    .receipt-content {
      text-align: center;
    }

    .receipt-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 20px;
      border-bottom: 2px dashed #ddd;
      margin-bottom: 20px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 20px;
    }

    .logo .material-icons {
      color: #667eea;
    }

    .receipt-badge {
      background: #667eea;
      color: white;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
    }

    .receipt-info {
      margin-bottom: 20px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px dashed #eee;
    }

    .info-row .label {
      color: #666;
    }

    .info-row .value {
      font-weight: 500;
      color: #333;
      font-family: monospace;
      font-size: 13px;
    }

    .book-section {
      text-align: left;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 12px;
      margin-bottom: 16px;
    }

    .book-section h4 {
      font-size: 12px;
      color: #999;
      margin: 0 0 8px 0;
      text-transform: uppercase;
    }

    .book-section .book-title {
      font-weight: 600;
      color: #333;
      margin: 0 0 4px 0;
    }

    .book-section .book-author {
      color: #666;
      font-size: 14px;
      margin: 0;
    }

    .total-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 12px;
      margin-bottom: 16px;
    }

    .total-section .amount {
      font-size: 28px;
      font-weight: 700;
    }

    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 10px;
      margin-bottom: 16px;
    }

    .status-badge.pending {
      background: #fff3cd;
      color: #856404;
    }

    .status-badge.completed {
      background: #d4edda;
      color: #155724;
    }

    .status-badge.given {
      background: #cce5ff;
      color: #004085;
    }

    .notice-section {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px;
      border-radius: 10px;
      text-align: left;
    }

    .notice-section.waiting {
      background: #fff3cd;
    }

    .notice-section.ready {
      background: #d4edda;
    }

    .notice-section.collected {
      background: #cce5ff;
    }

    .notice-section .material-icons {
      font-size: 20px;
      flex-shrink: 0;
    }

    .notice-section.waiting .material-icons { color: #ffc107; }
    .notice-section.waiting p { color: #856404; }

    .notice-section.ready .material-icons { color: #28a745; }
    .notice-section.ready p { color: #155724; }

    .notice-section.collected .material-icons { color: #0d6efd; }
    .notice-section.collected p { color: #004085; }

    .notice-section p {
      margin: 0;
      font-size: 13px;
      line-height: 1.5;
    }

    @media (max-width: 768px) {
      .order-body {
        flex-direction: column;
        align-items: flex-start;
      }

      .status-actions {
        width: 100%;
      }

      .order-footer {
        flex-direction: column;
      }

      .btn-action {
        justify-content: center;
      }
    }
  `]
})
export class MyPurchasesComponent implements OnInit {
  orders: Order[] = [];
  isLoading = false;
  showReceiptModal = false;
  selectedOrder: Order | null = null;

  constructor(
    private demoPaymentService: DemoPaymentService,
    private authService: AuthService,
    private receiptService: ReceiptService
  ) {}

  ngOnInit() {
    this.loadOrders();
  }

  loadOrders() {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.isLoading = true;
    this.demoPaymentService.getOrdersByStudent(userId).subscribe({
      next: (res) => {
        this.orders = res.data || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  downloadReceipt(order: Order) {
    const user = this.authService.getUser();
    this.receiptService.downloadReceipt({
      transactionId: order.transactionId,
      amount: order.amount,
      bookTitle: order.book.title,
      bookAuthor: order.book.author,
      studentName: user?.fullName || '',
      studentEmail: user?.email || '',
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

  viewReceipt(order: Order) {
    this.selectedOrder = order;
    this.showReceiptModal = true;
  }

  closeReceiptModal() {
    this.showReceiptModal = false;
    this.selectedOrder = null;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'completed';
      case 'GIVEN': return 'given';
      case 'PENDING': return 'pending';
      default: return 'pending';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'check_circle';
      case 'GIVEN': return 'verified';
      case 'PENDING': return 'hourglass_empty';
      default: return 'receipt';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'Ready for Pickup';
      case 'GIVEN': return 'Collected';
      case 'PENDING': return 'Processing';
      default: return status;
    }
  }

  getNoticeClass(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'ready';
      case 'GIVEN': return 'collected';
      case 'PENDING': return 'waiting';
      default: return 'waiting';
    }
  }

  getNoticeIcon(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'local_shipping';
      case 'GIVEN': return 'celebration';
      case 'PENDING': return 'schedule';
      default: return 'info';
    }
  }

  getNoticeText(status: string): string {
    switch (status) {
      case 'COMPLETED': return 'Visit library with this receipt to collect your book';
      case 'GIVEN': return 'Book collected. Enjoy reading!';
      case 'PENDING': return 'Payment is being processed. Please wait.';
      default: return '';
    }
  }
}

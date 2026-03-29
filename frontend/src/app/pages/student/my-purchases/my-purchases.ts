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

          <div class="order-body">
            <div class="book-info">
              <div class="book-icon">
                <img *ngIf="order.book.imageData" [src]="order.book.imageData" alt="Book Cover" class="book-cover-img">
                <span *ngIf="!order.book.imageData" class="material-icons">menu_book</span>
              </div>
              <div class="book-details">
                <h3 class="book-title">{{ order.book.title }}</h3>
                <p class="book-author">by {{ order.book.author }}</p>
                <p class="book-price">₹{{ order.amount }}</p>
              </div>
            </div>

            <div class="status-actions">
              <div class="action-notice" [ngClass]="getNoticeClass(order.status)">
                <span class="material-icons">{{ getNoticeIcon(order.status) }}</span>
                <span>{{ getNoticeText(order.status) }}</span>
              </div>
            </div>
          </div>

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
              <div class="book-cover-row" *ngIf="selectedOrder.book.imageData">
                <img [src]="selectedOrder.book.imageData" alt="Book Cover" class="receipt-book-cover">
              </div>
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
    /* Page Container */
    .page-container {
      padding: 0;
      background: #F8FAFC;
      min-height: calc(100vh - 56px);
      max-width: 100%;
    }

    .page-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      padding: 24px 24px 0;
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
    }

    .page-icon {
      color: #667EEA;
      font-size: 28px;
    }

    .page-subtitle {
      font-size: 0.9rem;
      color: #64748B;
      margin: 0;
      padding-left: 40px;
    }

    /* Orders Container */
    .orders-container {
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      border: 1px solid #E2E8F0;
      margin: 24px;
    }

    .orders-count {
      padding: 16px 20px;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
      font-weight: 600;
      color: #1E293B;
    }

    .order-item {
      border-bottom: 1px solid #E2E8F0;
    }

    .order-item:last-child {
      border-bottom: none;
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      background: #F8FAFC;
      border-bottom: 1px solid #E2E8F0;
    }

    .order-meta {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .order-id {
      font-weight: 600;
      color: #1E293B;
      font-size: 14px;
    }

    .order-date {
      font-size: 12px;
      color: #94A3B8;
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
      background: #FEF3C7;
      color: #D97706;
    }

    .order-status.completed {
      background: #D1FAE5;
      color: #059669;
    }

    .order-status.given {
      background: #DBEAFE;
      color: #2563EB;
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
      background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
      color: white;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      overflow: hidden;
    }

    .book-icon .material-icons {
      font-size: 28px;
    }

    .book-cover-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
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
      color: #1E293B;
    }

    .book-author {
      margin: 0;
      font-size: 13px;
      color: #64748B;
    }

    .book-price {
      margin: 4px 0 0 0;
      font-size: 18px;
      font-weight: 700;
      color: #667EEA;
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
      background: #FEF3C7;
      color: #D97706;
    }

    .action-notice.ready {
      background: #D1FAE5;
      color: #059669;
    }

    .action-notice.collected {
      background: #DBEAFE;
      color: #2563EB;
    }

    .action-notice .material-icons {
      font-size: 20px;
      flex-shrink: 0;
    }

    .order-footer {
      display: flex;
      gap: 12px;
      padding: 16px 20px;
      background: #FAFAFA;
      border-top: 1px solid #E2E8F0;
    }

    .btn-action {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      border: 1px solid #E2E8F0;
      background: white;
    }

    .btn-action .material-icons {
      font-size: 18px;
    }

    .btn-action.receipt {
      background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
      color: white;
      border-color: transparent;
    }

    .btn-action.receipt:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }

    .btn-action.view {
      color: #64748B;
    }

    .btn-action.view:hover {
      background: #F1F5F9;
      border-color: #667EEA;
      color: #667EEA;
    }

    .empty-state {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 16px;
      margin: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      border: 1px solid #E2E8F0;
    }

    .empty-icon {
      font-size: 80px;
      color: #CBD5E1;
      margin-bottom: 24px;
    }

    .empty-state h3 {
      margin: 0 0 12px 0;
      color: #64748B;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .empty-state p {
      color: #94A3B8;
      margin: 0 0 24px 0;
      font-size: 1rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 28px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
      transition: all 0.2s;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
      color: white;
    }

    .btn-primary:hover {
      opacity: 0.9;
      transform: translateY(-2px);
    }

    .loading-state {
      text-align: center;
      padding: 80px 20px;
      background: white;
      border-radius: 16px;
      margin: 24px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
      border: 1px solid #E2E8F0;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #E2E8F0;
      border-top-color: #667EEA;
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
      border-bottom: 1px solid #E2E8F0;
    }

    .modal-header h3 {
      margin: 0;
      font-size: 1.125rem;
      color: #1E293B;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #64748B;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #F1F5F9;
      color: #1E293B;
    }

    .close-btn .material-icons {
      font-size: 24px;
    }

    .modal-body {
      padding: 24px;
    }

    .modal-footer {
      padding: 16px 24px;
      border-top: 1px solid #E2E8F0;
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
      border-bottom: 2px dashed #E2E8F0;
      margin-bottom: 20px;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 1.25rem;
      color: #1E293B;
    }

    .logo .material-icons {
      color: #667EEA;
    }

    .receipt-badge {
      background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
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
      border-bottom: 1px dashed #E2E8F0;
    }

    .info-row .label {
      color: #64748B;
    }

    .info-row .value {
      font-weight: 500;
      color: #1E293B;
      font-family: monospace;
      font-size: 13px;
    }

    .book-section {
      text-align: left;
      padding: 16px;
      background: #F8FAFC;
      border-radius: 12px;
      margin-bottom: 16px;
    }

    .book-cover-row {
      text-align: center;
      margin-bottom: 12px;
    }

    .receipt-book-cover {
      width: 80px;
      height: 100px;
      object-fit: cover;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .book-section h4 {
      font-size: 12px;
      color: #94A3B8;
      margin: 0 0 8px 0;
      text-transform: uppercase;
    }

    .book-section .book-title {
      font-weight: 600;
      color: #1E293B;
      margin: 0 0 4px 0;
    }

    .book-section .book-author {
      color: #64748B;
      font-size: 14px;
      margin: 0;
    }

    .total-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px;
      background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
      color: white;
      border-radius: 12px;
      margin-bottom: 16px;
    }

    .total-section .amount {
      font-size: 1.75rem;
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
      background: #FEF3C7;
      color: #D97706;
    }

    .status-badge.completed {
      background: #D1FAE5;
      color: #059669;
    }

    .status-badge.given {
      background: #DBEAFE;
      color: #2563EB;
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
      background: #FEF3C7;
    }

    .notice-section.ready {
      background: #D1FAE5;
    }

    .notice-section.collected {
      background: #DBEAFE;
    }

    .notice-section .material-icons {
      font-size: 20px;
      flex-shrink: 0;
    }

    .notice-section.waiting .material-icons { color: #D97706; }
    .notice-section.waiting p { color: #D97706; }

    .notice-section.ready .material-icons { color: #059669; }
    .notice-section.ready p { color: #059669; }

    .notice-section.collected .material-icons { color: #2563EB; }
    .notice-section.collected p { color: #2563EB; }

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

      .orders-container {
        margin: 16px;
      }

      .empty-state,
      .loading-state {
        margin: 16px;
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

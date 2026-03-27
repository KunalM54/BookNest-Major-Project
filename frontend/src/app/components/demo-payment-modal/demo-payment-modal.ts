import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DemoPaymentService } from '../../services/demo-payment';
import { ReceiptService, ReceiptData } from '../../services/receipt.service';

@Component({
  selector: 'app-demo-payment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-overlay" *ngIf="isOpen" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        
        <!-- Header -->
        <div class="modal-header">
          <h2>Payment Gateway</h2>
          <span class="demo-badge">DEMO MODE</span>
          <button class="close-btn" (click)="close()">&times;</button>
        </div>

        <!-- Order Summary -->
        <div class="order-summary">
          <h3>Order Summary</h3>
          <div class="summary-item">
            <span>{{ paymentType === 'book' ? 'Book' : 'Fine Payment' }}</span>
            <span class="item-name">{{ description }}</span>
          </div>
          <div class="summary-item total">
            <span>Amount</span>
            <span class="amount">₹{{ amount }}</span>
          </div>
        </div>

        <!-- Payment Form -->
        <div class="payment-form" *ngIf="!isProcessing && !isSuccess && !isFailed">
          <h3>Payment Details</h3>
          
          <div class="form-group">
            <label>Card Number</label>
            <input type="text" [(ngModel)]="cardNumber" placeholder="1234 5678 9012 3456" maxlength="19" (input)="formatCardNumber()">
            <small class="hint">Test: 4111 1111 1111 1111</small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Expiry Date</label>
              <input type="text" [(ngModel)]="expiryDate" placeholder="MM/YY" maxlength="5" (input)="formatExpiry()">
            </div>
            <div class="form-group">
              <label>CVV</label>
              <input type="password" [(ngModel)]="cvv" placeholder="123" maxlength="3">
              <small class="hint">Any 3 digits</small>
            </div>
          </div>

          <div class="form-group">
            <label>Cardholder Name</label>
            <input type="text" [(ngModel)]="cardName" [placeholder]="customerName">
          </div>

          <div class="payment-methods">
            <div class="method-icons">
              <span class="method-icon">VISA</span>
              <span class="method-icon">MASTER</span>
              <span class="method-icon">UPI</span>
              <span class="method-icon">RUPAY</span>
            </div>
          </div>

          <button class="pay-btn" (click)="processPayment()" [disabled]="!isFormValid()">
            Pay ₹{{ amount }}
          </button>

          <p class="secure-notice">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Secured by 256-bit SSL Encryption
          </p>
        </div>

        <!-- Processing -->
        <div class="processing" *ngIf="isProcessing">
          <div class="spinner"></div>
          <h3>Processing Payment...</h3>
          <p>Please wait while we process your payment</p>
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
        </div>

        <!-- Success -->
        <div class="success" *ngIf="isSuccess">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h3>Payment Successful!</h3>
          <p>{{ successMessage }}</p>
          <div class="receipt">
            <div class="receipt-row">
              <span>Transaction ID</span>
              <span>{{ transactionId }}</span>
            </div>
            <div class="receipt-row">
              <span>Amount Paid</span>
              <span class="amount">₹{{ amount }}</span>
            </div>
            <div class="receipt-row">
              <span>Status</span>
              <span class="status-success">COMPLETED</span>
            </div>
          </div>
          
          <!-- Download Receipt Button -->
          <button class="download-btn" (click)="downloadReceipt()" *ngIf="paymentType === 'book'">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Download Receipt
          </button>
          
          <div class="success-notice" *ngIf="paymentType === 'book'">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <span>Show this receipt at library to collect your book</span>
          </div>

          <button class="done-btn" (click)="close()">Done</button>
        </div>

        <!-- Failed -->
        <div class="failed" *ngIf="isFailed">
          <div class="failed-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
          </div>
          <h3>Payment Failed</h3>
          <p>{{ errorMessage }}</p>
          <div class="failed-actions">
            <button class="retry-btn" (click)="resetForm()">Try Again</button>
            <button class="cancel-btn" (click)="close()">Cancel</button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
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
      animation: fadeIn 0.3s;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .modal-content {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 450px;
      max-height: 90vh;
      overflow-y: auto;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      animation: slideUp 0.3s;
    }

    @keyframes slideUp {
      from { transform: translateY(50px); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }

    .modal-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px 24px;
      border-radius: 16px 16px 0 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .modal-header h2 {
      margin: 0;
      font-size: 20px;
    }

    .demo-badge {
      background: #ffc107;
      color: #000;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
    }

    .close-btn {
      background: none;
      border: none;
      color: white;
      font-size: 28px;
      cursor: pointer;
      line-height: 1;
    }

    .order-summary {
      padding: 20px 24px;
      background: #f8f9fa;
      border-bottom: 1px solid #eee;
    }

    .order-summary h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
    }

    .summary-item {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }

    .item-name {
      color: #333;
      font-weight: 500;
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .summary-item.total {
      border-top: 1px dashed #ddd;
      margin-top: 8px;
      padding-top: 12px;
      font-weight: bold;
    }

    .amount {
      color: #667eea;
      font-size: 18px;
    }

    .payment-form {
      padding: 24px;
    }

    .payment-form h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
      color: #333;
    }

    .form-group {
      margin-bottom: 16px;
    }

    .form-group label {
      display: block;
      font-size: 13px;
      color: #666;
      margin-bottom: 6px;
    }

    .form-group input {
      width: 100%;
      padding: 12px 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 15px;
      transition: border-color 0.3s;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: #667eea;
    }

    .hint {
      color: #999;
      font-size: 11px;
      margin-top: 4px;
      display: block;
    }

    .form-row {
      display: flex;
      gap: 16px;
    }

    .form-row .form-group {
      flex: 1;
    }

    .payment-methods {
      margin: 20px 0;
      text-align: center;
    }

    .method-icons {
      display: flex;
      justify-content: center;
      gap: 12px;
    }

    .method-icon {
      background: #f0f0f0;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: bold;
      color: #666;
    }

    .pay-btn {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .pay-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
    }

    .pay-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .secure-notice {
      text-align: center;
      margin-top: 16px;
      font-size: 12px;
      color: #999;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .processing, .success, .failed {
      padding: 48px 24px;
      text-align: center;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 24px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .processing h3, .success h3, .failed h3 {
      margin: 0 0 12px 0;
      font-size: 20px;
    }

    .processing p, .success p, .failed p {
      color: #666;
      margin: 0;
    }

    .progress-bar {
      width: 100%;
      height: 4px;
      background: #f0f0f0;
      border-radius: 2px;
      margin-top: 24px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      animation: progress 2s ease-in-out infinite;
    }

    @keyframes progress {
      0% { width: 0%; }
      50% { width: 70%; }
      100% { width: 100%; }
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: #d4edda;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: #28a745;
    }

    .success-icon svg {
      width: 48px;
      height: 48px;
    }

    .failed-icon {
      width: 80px;
      height: 80px;
      background: #f8d7da;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
      color: #dc3545;
    }

    .failed-icon svg {
      width: 48px;
      height: 48px;
    }

    .receipt {
      background: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
      text-align: left;
    }

    .receipt-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      font-size: 14px;
    }

    .status-success {
      color: #28a745;
      font-weight: bold;
    }

    .done-btn {
      width: 100%;
      padding: 14px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: bold;
      cursor: pointer;
    }

    .download-btn {
      width: 100%;
      padding: 14px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: bold;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 12px;
      transition: all 0.2s;
    }

    .download-btn:hover {
      background: #5a6fd6;
      transform: translateY(-2px);
    }

    .success-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #fff3cd;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 13px;
      color: #856404;
    }

    .success-notice svg {
      flex-shrink: 0;
    }

    .failed-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .retry-btn {
      flex: 1;
      padding: 12px;
      background: #667eea;
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: bold;
      cursor: pointer;
    }

    .cancel-btn {
      flex: 1;
      padding: 12px;
      background: #f0f0f0;
      color: #666;
      border: none;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
    }
  `]
})
export class DemoPaymentModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() paymentType: 'book' | 'fine' = 'book';
  @Input() description = '';
  @Input() amount = 0;
  @Input() customerName = '';
  @Input() customerEmail = '';
  @Input() fineId?: number;
  @Input() bookTitle = '';
  @Input() bookAuthor = '';
  @Input() orderId?: number;

  @Output() paymentComplete = new EventEmitter<boolean>();
  @Output() closed = new EventEmitter<void>();

  cardNumber = '';
  expiryDate = '';
  cvv = '';
  cardName = '';

  isProcessing = false;
  isSuccess = false;
  isFailed = false;
  transactionId = '';
  successMessage = '';
  errorMessage = '';

  constructor(
    private demoPaymentService: DemoPaymentService,
    private receiptService: ReceiptService
  ) {}

  ngOnInit() {
    this.cardName = this.customerName;
  }

  downloadReceipt(): void {
    const receiptData: ReceiptData = {
      transactionId: this.transactionId,
      amount: this.amount,
      bookTitle: this.bookTitle || this.description,
      bookAuthor: this.bookAuthor || 'Unknown',
      studentName: this.customerName,
      studentEmail: this.customerEmail,
      date: new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      paymentMethod: 'DEMO',
      orderId: this.orderId || 0
    };
    this.receiptService.downloadReceipt(receiptData);
  }

  formatCardNumber() {
    this.cardNumber = this.cardNumber.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
  }

  formatExpiry() {
    if (this.expiryDate.length === 2 && !this.expiryDate.includes('/')) {
      this.expiryDate += '/';
    }
    this.expiryDate = this.expiryDate.replace(/\D/g, '');
    if (this.expiryDate.length > 2) {
      this.expiryDate = this.expiryDate.substring(0, 2) + '/' + this.expiryDate.substring(2, 4);
    }
  }

  isFormValid(): boolean {
    return this.cardNumber.length >= 19 && 
           this.expiryDate.length === 5 && 
           this.cvv.length >= 3 &&
           this.cardName.length > 0;
  }

  processPayment() {
    if (!this.isFormValid()) return;

    this.isProcessing = true;

    // Simulate payment processing time
    setTimeout(() => {
      // Use the order ID passed from parent as transaction ID
      this.transactionId = this.orderId ? 'ORD' + this.orderId : 'DEMO_' + Date.now();
      this.isProcessing = false;
      this.isSuccess = true;
      this.successMessage = this.paymentType === 'book' 
        ? 'Your book purchase was successful!' 
        : 'Your fine payment was successful!';
      
      // Emit completion event
      this.paymentComplete.emit(true);
    }, 2500);
  }

  resetForm() {
    this.isFailed = false;
    this.isSuccess = false;
    this.cardNumber = '';
    this.expiryDate = '';
    this.cvv = '';
    this.cardName = this.customerName;
  }

  close() {
    this.resetForm();
    this.closed.emit();
  }
}

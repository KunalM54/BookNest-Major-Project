import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FineService, Fine } from '../../../services/fine';
import { AuthService } from '../../../services/auth';
import { SnackbarService } from '../../../services/snackbar';
import { DemoPaymentService } from '../../../services/demo-payment';
import { DemoPaymentModalComponent } from '../../../components/demo-payment-modal/demo-payment-modal';

@Component({
  selector: 'app-fines',
  standalone: true,
  imports: [CommonModule, DemoPaymentModalComponent],
  templateUrl: './fines.html',
  styleUrls: ['./fines.css']
})
export class FinesComponent implements OnInit, OnDestroy {
  fines: Fine[] = [];
  totalPending = 0;
  isLoading = false;
  errorMessage = '';
  processingPayment: number | null = null;
  private refreshTimer: any;

  showPaymentModal = false;
  paymentAmount = 0;
  paymentDescription = '';
  currentTransactionId = '';
  currentFineId?: number;

  constructor(
    private fineService: FineService,
    public authService: AuthService,
    private snackbar: SnackbarService,
    private demoPaymentService: DemoPaymentService
  ) { }

  ngOnInit() {
    this.loadFines();
    this.refreshTimer = setInterval(() => this.loadFines(true), 60_000);
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  loadFines(silent = false) {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.errorMessage = 'Please login to view your fines';
      return;
    }

    if (!silent) {
      this.isLoading = true;
    }
    this.errorMessage = '';

    this.fineService.getFinesByStudent(userId).subscribe({
      next: (res) => {
        if (res.success !== false) {
          this.fines = Array.isArray(res.data) ? res.data : [];
          this.totalPending = res.totalPending || 0;
        } else {
          this.fines = [];
          this.totalPending = 0;
          this.errorMessage = res.message || 'Failed to load fines';
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading fines:', err);
        this.errorMessage = 'Unable to load fines. Please try again.';
        this.isLoading = false;
      }
    });
  }

  retryLoadFines() {
    this.errorMessage = '';
    this.loadFines();
  }

  payFine(fineId: number) {
    const fine = this.fines.find((f) => f.id === fineId);
    if (!fine) return;

    const userId = this.authService.getUserId();
    if (!userId) {
      this.snackbar.show('Please login to pay fine');
      return;
    }

    this.processingPayment = fineId;

    this.demoPaymentService.createFinePaymentOrder(userId, fineId).subscribe({
      next: (res) => {
        if (res.success && res.orderId) {
          this.currentTransactionId = res.orderId;
          this.currentFineId = fineId;
          this.paymentAmount = res.amount || fine.fineAmount;
          this.paymentDescription = res.description || 'Fine Payment';
          this.showPaymentModal = true;
        } else {
          this.processingPayment = null;
          this.snackbar.show(res.message || 'Failed to initiate payment');
        }
      },
      error: (err) => {
        this.processingPayment = null;
        this.snackbar.show('Payment failed');
      }
    });
  }

  onPaymentComplete() {
    if (this.currentFineId) {
      this.demoPaymentService.verifyFinePayment(this.currentTransactionId, this.currentFineId).subscribe({
        next: (res) => {
          this.processingPayment = null;
          this.showPaymentModal = false;
          if (res.success) {
            this.snackbar.show('Fine payment successful!');
            this.loadFines();
          } else {
            this.snackbar.show(res.message || 'Payment verification failed');
          }
        },
        error: () => {
          this.processingPayment = null;
          this.showPaymentModal = false;
          this.snackbar.show('Payment verification failed');
        }
      });
    }
  }

  onPaymentModalClose() {
    this.showPaymentModal = false;
    this.processingPayment = null;
  }

  payAllFines() {
    if (this.totalPending <= 0) return;

    const unpaidFines = this.fines.filter(f => f.fineStatus === 'UNPAID');
    const confirmPay = confirm(
      `Pay all ${unpaidFines.length} fines totaling ₹${this.totalPending}?`
    );
    if (!confirmPay) return;

    const payNext = (index: number) => {
      if (index >= unpaidFines.length) {
        this.snackbar.show('All fines processing initiated!');
        this.loadFines();
        return;
      }

      this.payFine(unpaidFines[index].id);
    };

    payNext(0);
  }

  isUnpaid(fine: Fine): boolean {
    return fine.fineStatus === 'UNPAID';
  }

  isPaid(fine: Fine): boolean {
    return fine.fineStatus === 'PAID';
  }

  getPaidAmount(fine: Fine): number {
    return this.isPaid(fine) ? fine.fineAmount : 0;
  }

  get pendingCount(): number {
    return this.fines.filter((f) => f.fineStatus === 'UNPAID').length;
  }
}

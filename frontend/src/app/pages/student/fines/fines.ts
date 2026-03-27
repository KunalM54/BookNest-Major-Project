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
        this.fines = res.data || [];
        this.totalPending = res.totalPending || 0;
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load fines';
        this.isLoading = false;
      }
    });
  }

  payFine(fineId: number) {
    const fine = this.fines.find((f) => f.id === fineId);
    const outstanding = fine ? this.getOutstanding(fine) : 0;

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
          this.paymentAmount = res.amount || outstanding;
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

    const pendingFines = this.fines.filter(f => f.status === 'PENDING');
    const confirmPay = confirm(
      `Pay all ${pendingFines.length} fines totaling ₹${this.totalPending}?`
    );
    if (!confirmPay) return;

    const payNext = (index: number) => {
      if (index >= pendingFines.length) {
        this.snackbar.show('All fines processing initiated!');
        this.loadFines();
        return;
      }

      this.payFine(pendingFines[index].id);
    };

    payNext(0);
  }

  hasOutstanding(fine: Fine): boolean {
    return this.getOutstanding(fine) > 0;
  }

  getOutstanding(fine: Fine): number {
    const total = Number(fine.fineAmount || 0);
    const paid = Number(fine.paidAmount || 0);
    return Math.max(0, Math.round((total - paid) * 100) / 100);
  }

  get pendingCount(): number {
    return this.fines.filter((f) => f.status === 'PENDING').length;
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FineService, Fine } from '../../../services/fine';
import { AuthService } from '../../../services/auth';
import { SnackbarService } from '../../../services/snackbar';

@Component({
  selector: 'app-fines',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './fines.html',
  styleUrls: ['./fines.css']
})
export class FinesComponent implements OnInit {
  fines: Fine[] = [];
  totalPending = 0;
  isLoading = false;
  errorMessage = '';
  processingPayment: number | null = null;

  constructor(
    private fineService: FineService,
    private authService: AuthService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    this.loadFines();
  }

  loadFines() {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.errorMessage = 'Please login to view your fines';
      return;
    }

    this.isLoading = true;
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
    const confirmPay = confirm('Pay this fine now?');
    if (!confirmPay) return;

    this.processingPayment = fineId;

    this.fineService.payFine(fineId, 'ONLINE').subscribe({
      next: (res) => {
        this.processingPayment = null;
        if (res.success) {
          this.snackbar.show('Fine paid successfully!');
          this.loadFines();
        } else {
          this.snackbar.show(res.message || 'Payment failed');
        }
      },
      error: (err) => {
        this.processingPayment = null;
        this.snackbar.show('Payment failed');
      }
    });
  }

  payAllFines() {
    if (this.totalPending <= 0) return;

    const confirmPay = confirm(`Pay all fines totaling ₹${this.totalPending}?`);
    if (!confirmPay) return;

    this.processingPayment = -1;

    let paid = 0;
    const pendingFines = this.fines.filter(f => f.status === 'PENDING');
    
    const payNext = (index: number) => {
      if (index >= pendingFines.length) {
        this.processingPayment = null;
        this.snackbar.show(`Paid ${paid} fine(s) successfully!`);
        this.loadFines();
        return;
      }

      this.fineService.payFine(pendingFines[index].id, 'ONLINE').subscribe({
        next: (res) => {
          if (res.success) paid++;
          payNext(index + 1);
        },
        error: () => {
          payNext(index + 1);
        }
      });
    };

    payNext(0);
  }

  getStatusClass(status: string): string {
    return status === 'PENDING' ? 'pending' : 'paid';
  }
}

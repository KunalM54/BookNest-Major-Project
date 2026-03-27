import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../services/auth';
import { ReadingGoalService, ReadingGoal } from '../../../services/reading-goal';
import { SnackbarService } from '../../../services/snackbar';

@Component({
  selector: 'app-reading-goals',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reading-goals.html',
  styleUrls: ['./reading-goals.css']
})
export class ReadingGoalsComponent implements OnInit {
  goals: ReadingGoal[] = [];
  activeGoals: ReadingGoal[] = [];
  isLoading = false;
  showAddModal = false;

  newGoal = {
    goalType: 'MONTHLY',
    targetBooks: 3,
    startDate: '',
    endDate: ''
  };

  goalTypes = [
    { value: 'WEEKLY', label: 'Weekly' },
    { value: 'MONTHLY', label: 'Monthly' },
    { value: 'YEARLY', label: 'Yearly' }
  ];

  constructor(
    private authService: AuthService,
    private goalService: ReadingGoalService,
    private snackbar: SnackbarService
  ) { }

  ngOnInit() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.loadGoals(userId);
      this.loadActiveGoals(userId);
    }
  }

  loadGoals(userId: number) {
    this.isLoading = true;
    this.goalService.getGoals(userId).subscribe({
      next: (goals) => {
        this.goals = goals;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.snackbar.show('Failed to load reading goals');
      }
    });
  }

  loadActiveGoals(userId: number) {
    this.goalService.getActiveGoals(userId).subscribe({
      next: (goals) => {
        this.activeGoals = goals;
      },
      error: () => {}
    });
  }

  openAddModal() {
    const today = new Date();
    this.newGoal.startDate = today.toISOString().split('T')[0];
    this.newGoal.endDate = new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())
      .toISOString().split('T')[0];
    this.showAddModal = true;
  }

  closeModal() {
    this.showAddModal = false;
  }

  createGoal() {
    const userId = this.authService.getUserId();
    if (!userId) return;

    if (!this.newGoal.targetBooks || this.newGoal.targetBooks < 1) {
      this.snackbar.show('Target must be at least 1 book');
      return;
    }

    if (!this.newGoal.startDate || !this.newGoal.endDate) {
      this.snackbar.show('Please select start and end dates');
      return;
    }

    if (new Date(this.newGoal.endDate) < new Date(this.newGoal.startDate)) {
      this.snackbar.show('End date must be after start date');
      return;
    }

    this.goalService.createGoal(
      userId,
      this.newGoal.goalType,
      this.newGoal.targetBooks,
      this.newGoal.startDate,
      this.newGoal.endDate
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackbar.show('Reading goal created!');
          this.loadGoals(userId);
          this.loadActiveGoals(userId);
          this.closeModal();
        } else {
          this.snackbar.show(res.message || 'Failed to create goal');
        }
      },
      error: () => {
        this.snackbar.show('Failed to create reading goal');
      }
    });
  }

  updateProgress(goal: ReadingGoal) {
    const userId = this.authService.getUserId();
    if (!userId || !goal.id) return;

    this.goalService.updateProgress(goal.id, userId).subscribe({
      next: (res) => {
        if (res.success) {
          this.loadGoals(userId);
          this.loadActiveGoals(userId);
          this.snackbar.show('Progress updated!');
        }
      },
      error: () => {
        this.snackbar.show('Failed to update progress');
      }
    });
  }

  deleteGoal(goal: ReadingGoal) {
    const userId = this.authService.getUserId();
    if (!userId || !goal.id) return;

    if (!confirm('Delete this reading goal?')) return;

    this.goalService.deleteGoal(goal.id, userId).subscribe({
      next: (res) => {
        if (res.success) {
          this.snackbar.show('Goal deleted');
          this.loadGoals(userId);
          this.loadActiveGoals(userId);
        }
      },
      error: () => {
        this.snackbar.show('Failed to delete goal');
      }
    });
  }

  getProgressPercent(goal: ReadingGoal): number {
    if (!goal.targetBooks || goal.targetBooks === 0) return 0;
    return Math.min(100, Math.round((goal.currentProgress / goal.targetBooks) * 100));
  }

  getGoalTypeLabel(type: string): string {
    return this.goalTypes.find(t => t.value === type)?.label || type;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }
}

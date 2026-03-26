import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BorrowService } from '../../../services/borrow';
import { AuthService } from '../../../services/auth';
import { FineService } from '../../../services/fine';
import { GlobalSearchBarComponent } from '../../../components/global-search-bar/global-search-bar';
import { scrollToTop } from '../../../utils/scroll-to-top';

@Component({
  selector: 'app-my-books',
  standalone: true,
  imports: [CommonModule, FormsModule, GlobalSearchBarComponent],
  templateUrl: './my-books.html',
  styleUrls: ['./my-books.css']
})
export class MyBooksComponent implements OnInit, OnDestroy {

  borrowedBooks: any[] = [];
  filteredBooks: any[] = [];
  paginatedBooks: any[] = [];
  isLoading = false;
  errorMessage = '';
  searchTerm = '';
  sortBy = 'newest';
  
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;

  private refreshTimer: any;
  private currentUserId: number | null = null;

  constructor(
    private borrowService: BorrowService,
    private authService: AuthService,
    private fineService: FineService
  ) { }

  ngOnInit() {
    this.loadBooks();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  loadBooks() {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.errorMessage = 'Please login to view your books';
      return;
    }

    this.currentUserId = userId;

    this.isLoading = true;
    this.errorMessage = '';

    this.borrowService.getMyBooks(userId).subscribe({
      next: (books) => {
        if (books.length === 0) {
          this.errorMessage = 'No books borrowed currently.';
          this.borrowedBooks = [];
        } else {
          this.borrowedBooks = books.map((book: any) => ({
            id: book.id,
            title: book.bookTitle || book.title,
            author: book.bookAuthor || book.author || 'Unknown',
            bookImage: book.bookImage || null,
            borrowDate: book.requestDate || book.borrowDate,
            dueDate: book.dueDate,
            returnDate: book.returnDate,
            status: book.status,
            isOverdue: book.status === 'OVERDUE' || (book.dueDate && new Date(book.dueDate) < new Date())
          }));
          this.calculateFines(userId);

          if (!this.refreshTimer) {
            // Keep fines live for overdue borrows.
            this.refreshTimer = setInterval(() => {
              if (this.currentUserId) {
                this.calculateFines(this.currentUserId);
              }
            }, 60_000);
          }
        }
        this.applyFilters();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading books', err);
        this.errorMessage = 'Failed to load your books. Please try again.';
        this.isLoading = false;
      }
    });
  }

  calculateFines(userId: number) {
    this.fineService.getFinesByStudent(userId).subscribe({
      next: (res) => {
        if (!res?.data) return;

        const fineMap = new Map<number, any>();
        (res.data || []).forEach((fine: any) => {
          const borrowId = fine?.borrow?.id;
          if (borrowId != null) {
            fineMap.set(Number(borrowId), fine);
          }
        });

        this.borrowedBooks = this.borrowedBooks.map((book) => {
          const fine = fineMap.get(book.id);
          if (!fine) {
            return {
              ...book,
              lateDays: 0,
              fineAmount: 0,
              paidAmount: 0,
              totalFine: 0,
              fineStatus: book.isOverdue ? 'OVERDUE' : 'ACTIVE'
            };
          }

          const totalFine = Number(fine.fineAmount || 0);
          const paidAmount = Number(fine.paidAmount || 0);
          const outstanding = Math.max(0, Math.round((totalFine - paidAmount) * 100) / 100);

          return {
            ...book,
            lateDays: Number(fine.daysOverdue || 0),
            // Show outstanding fine (dynamic) on UI.
            fineAmount: outstanding,
            paidAmount,
            totalFine,
            fineStatus: book.isOverdue ? 'OVERDUE' : 'ACTIVE'
          };
        });

        this.applyFilters();
      },
      error: () => {}
    });
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  applyFilters() {
    let data = [...this.borrowedBooks];
    
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      data = data.filter(book =>
        book.title.toLowerCase().includes(term) ||
        book.author.toLowerCase().includes(term)
      );
    }

    data = this.sortBooks(data);
    this.filteredBooks = data;
    this.updatePagination();
  }

  sortBooks(data: any[]): any[] {
    return data.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return new Date(b.borrowDate || 0).getTime() - new Date(a.borrowDate || 0).getTime();
        case 'oldest':
          return new Date(a.borrowDate || 0).getTime() - new Date(b.borrowDate || 0).getTime();
        case 'titleAZ':
          return (a.title || '').localeCompare(b.title || '');
        default:
          return 0;
      }
    });
  }

  updatePagination() {
    const total = this.filteredBooks.length;
    this.totalPages = Math.max(1, Math.ceil(total / this.pageSize));
    if (this.currentPage > this.totalPages) this.currentPage = this.totalPages;
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedBooks = this.filteredBooks.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) return;
    this.currentPage = page;
    this.updatePagination();
    scrollToTop();
  }

  goToPreviousPage() { this.goToPage(this.currentPage - 1); }
  goToNextPage() { this.goToPage(this.currentPage + 1); }

  get pageNumbers(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [];
    if (current <= 4) {
      for (let i = 1; i <= 5; i++) pages.push(i);
      pages.push(-1, total);
    } else if (current >= total - 3) {
      pages.push(1, -1);
      for (let i = total - 4; i <= total; i++) pages.push(i);
    } else {
      pages.push(1, -1, current - 1, current, current + 1, -2, total);
    }
    return pages;
  }

  get paginationStart(): number {
    return this.filteredBooks.length === 0 ? 0 : (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    return Math.min(this.currentPage * this.pageSize, this.filteredBooks.length);
  }
}

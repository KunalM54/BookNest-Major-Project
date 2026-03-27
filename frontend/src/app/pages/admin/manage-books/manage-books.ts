import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Book, BookService } from '../../../services/book';
import { SnackbarService } from '../../../services/snackbar';
import { GlobalSearchBarComponent } from '../../../components/global-search-bar/global-search-bar';
import { scrollToTop } from '../../../utils/scroll-to-top';
import { CategoryService, Category } from '../../../services/category';

interface BookForm {
  id: number | null;
  title: string;
  isbn: string;
  author: string;
  category: string;
  imageData: string | null;
  totalCopies: number;
  price: number | null;
  summary: string | null;
  authorInfo: string | null;
  bookUrl: string | null;
}

@Component({
  selector: 'app-manage-books',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, GlobalSearchBarComponent],
  templateUrl: './manage-books.html',
  styleUrls: ['./manage-books.css']
})
export class ManageBooksComponent implements OnInit {
  private readonly maxImageSizeBytes = 2 * 1024 * 1024;
  readonly pageSize = 8;

  searchTerm = '';
  selectedCategory = 'All';
  sortBy = 'newest';
  isLoading = false;
  errorMessage = '';
  selectedImageName = '';
  imagePreview: string | null = null;
  imageInputMode: 'file' | 'url' = 'file';

  books: Book[] = [];
  filteredBooks: Book[] = [];
  paginatedBooks: Book[] = [];
  currentPage = 1;
  totalPages = 1;
  totalBooksCount = 0;

  pagingMode: 'server' | 'client' = 'server';
  private hasLoadedAllBooks = false;

  filterCategories: Category[] = [];
  formCategories: Category[] = [];
  newCategoryName = '';
  showCategoryModal = false;

  showModal = false;
  isEditMode = false;
  editingBook: Book | null = null;
  bookForm: BookForm = this.createEmptyForm();
  form!: FormGroup;

  constructor(
    private bookService: BookService,
    private categoryService: CategoryService,
    private fb: FormBuilder,
    private snackbarService: SnackbarService
  ) { }

  capitalizeFirst(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  capitalizeTitle(): void {
    const titleControl = this.form.get('title');
    if (titleControl) {
      const value = titleControl.value || '';
      titleControl.setValue(this.capitalizeFirst(value), { emitEvent: false });
    }
  }

  ngOnInit() {
    this.loadCategories();
    this.refreshBooks(true);
  }

  loadCategories() {
    this.categoryService.getActiveCategories().subscribe({
      next: (categories) => {
        this.filterCategories = [{ id: 0, name: 'All', displayOrder: -1 } as Category, ...categories];
        this.formCategories = categories;
      },
      error: () => {
        this.snackbarService.show('Failed to load categories');
      }
    });
  }

  openCategoryModal() {
    this.newCategoryName = '';
    this.showCategoryModal = true;
  }

  closeCategoryModal() {
    this.showCategoryModal = false;
    this.newCategoryName = '';
  }

  saveNewCategory() {
    const name = this.newCategoryName.trim();
    if (!name) {
      this.snackbarService.show('Category name is required');
      return;
    }

    this.categoryService.createCategory(name).subscribe({
      next: (response) => {
        if (response.success) {
          this.snackbarService.show('Category created successfully!');
          const newCategory = response.data as Category;
          this.formCategories = [...this.formCategories, newCategory];
          this.filterCategories = [
            { id: 0, name: 'All', displayOrder: -1 } as Category,
            ...this.formCategories
          ];
          this.form.patchValue({ category: newCategory.name });
          this.closeCategoryModal();
        } else {
          this.snackbarService.show(response.message || 'Failed to create category');
        }
      },
      error: () => {
        this.snackbarService.show('Failed to create category');
      }
    });
  }

  private isClientMode(): boolean {
    return this.searchTerm.trim().length > 0 || this.selectedCategory !== 'All';
  }

  private getServerSortParam(): string {
    switch (this.sortBy) {
      case 'oldest':
        return 'id,asc';
      case 'titleAZ':
        return 'title,asc';
      case 'titleZA':
        return 'title,desc';
      case 'authorAZ':
        return 'author,asc';
      case 'newest':
      default:
        return 'id,desc';
    }
  }

  private refreshBooks(resetPage = true) {
    if (resetPage) {
      this.currentPage = 1;
    }

    if (this.isClientMode()) {
      this.pagingMode = 'client';

      if (this.hasLoadedAllBooks) {
        this.filterBooks(false);
        return;
      }

      this.loadBooksAll();
      return;
    }

    this.pagingMode = 'server';
    this.loadBooksPaged();
  }

  private loadBooksAll() {
    this.isLoading = true;
    this.bookService.getAllBooks().subscribe({
      next: (data: Book[]) => {
        this.books = data;
        this.hasLoadedAllBooks = true;
        this.totalBooksCount = data.length;
        this.filterBooks(false);
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load books';
        this.isLoading = false;
      }
    });
  }

  private loadBooksPaged() {
    this.isLoading = true;
    const pageIndex = Math.max(0, this.currentPage - 1);

    this.bookService.getBooksPaged(pageIndex, this.pageSize, this.getServerSortParam()).subscribe({
      next: (page) => {
        const content = page?.content || [];
        this.paginatedBooks = content;
        this.filteredBooks = content;
        this.books = [];
        this.totalBooksCount = Number(page?.totalElements || content.length);
        this.totalPages = Math.max(1, Number(page?.totalPages || 1));
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load books';
        this.isLoading = false;
      }
    });
  }

  private createEmptyForm(): BookForm {
    return {
      id: null,
      title: '',
      isbn: '',
      author: '',
      category: '',
      imageData: null,
      totalCopies: 1,
      price: null,
      summary: null,
      authorInfo: null,
      bookUrl: null
    };
  }

  createForm() {
    this.form = this.fb.group({
      title: ['', Validators.required],
      isbn: ['', [Validators.required, Validators.pattern(/^\d{13}$/)]],
      author: ['', Validators.required],
      category: ['', Validators.required],
      totalCopies: [1, [Validators.required, Validators.min(1)]],
      price: [null],
      summary: [''],
      authorInfo: [''],
      imageUrl: [''],
      bookUrl: ['', Validators.pattern(/^https?:\/\/.+/)]
    });
  }

  // Backwards compatible entry-point for existing calls
  loadBooks() {
    this.refreshBooks(true);
  }

  filterBooks(resetPage = true) {
    this.filteredBooks = this.books.filter((book) => {
      const matchesSearch =
        book.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        book.author.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        book.isbn.toLowerCase().includes(this.searchTerm.toLowerCase());

      const matchesCategory =
        this.selectedCategory === 'All' ||
        book.category === this.selectedCategory;

      return matchesSearch && matchesCategory;
    });

    this.filteredBooks = this.sortBooks(this.filteredBooks);

    if (resetPage) {
      this.currentPage = 1;
    }
    this.updatePagination();
  }

  sortBooks(books: Book[]): Book[] {
    return books.sort((a, b) => {
      switch (this.sortBy) {
        case 'newest':
          return (b.id || 0) - (a.id || 0);
        case 'oldest':
          return (a.id || 0) - (b.id || 0);
        case 'titleAZ':
          return a.title.localeCompare(b.title);
        case 'titleZA':
          return b.title.localeCompare(a.title);
        case 'authorAZ':
          return a.author.localeCompare(b.author);
        default:
          return 0;
      }
    });
  }

  onSortChange() {
    this.refreshBooks(true);
  }

  setCategory(cat: string) {
    this.selectedCategory = cat === 'All' ? 'All' : cat;
    this.refreshBooks(true);
  }

  onSearchChange() {
    this.refreshBooks(true);
  }

  updatePagination() {
    const totalBooks = this.filteredBooks.length;
    this.totalPages = Math.max(1, Math.ceil(totalBooks / this.pageSize));

    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedBooks = this.filteredBooks.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages || page === this.currentPage) {
      return;
    }

    this.currentPage = page;

    if (this.pagingMode === 'server') {
      this.loadBooksPaged();
    } else {
      this.updatePagination();
    }

    scrollToTop();
  }

  goToPreviousPage() {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage() {
    this.goToPage(this.currentPage + 1);
  }

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
    const total = this.pagingMode === 'server' ? this.totalBooksCount : this.filteredBooks.length;
    if (total === 0) return 0;
    return (this.currentPage - 1) * this.pageSize + 1;
  }

  get paginationEnd(): number {
    const total = this.pagingMode === 'server' ? this.totalBooksCount : this.filteredBooks.length;
    return Math.min(this.currentPage * this.pageSize, total);
  }

  openAddModal() {
    this.isEditMode = false;
    this.editingBook = null;
    this.errorMessage = '';
    this.bookForm = this.createEmptyForm();
    this.createForm();
    this.imagePreview = null;
    this.selectedImageName = '';
    this.imageInputMode = 'file';
    this.showModal = true;
  }

  openEditModal(book: Book) {
    this.isEditMode = true;
    this.editingBook = book;
    this.errorMessage = '';
    this.bookForm = {
      id: book.id ?? null,
      title: book.title,
      isbn: book.isbn,
      author: book.author,
      category: book.category,
      imageData: book.imageData ?? null,
      totalCopies: book.totalCopies,
      price: book.price || null,
      summary: book.summary || null,
      authorInfo: book.authorInfo || null,
      bookUrl: book.bookUrl || null
    };
    this.createForm();
    this.form.patchValue({
      title: book.title,
      isbn: book.isbn,
      author: book.author,
      category: book.category,
      totalCopies: book.totalCopies,
      price: book.price || null,
      summary: book.summary || '',
      authorInfo: book.authorInfo || '',
      bookUrl: book.bookUrl || ''
    });
    this.imagePreview = book.imageData ?? null;
    this.selectedImageName = book.imageData ? 'Current saved cover' : '';
    this.imageInputMode = 'file';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingBook = null;
    this.imagePreview = null;
    this.selectedImageName = '';
  }

  setImageInputMode(mode: 'file' | 'url') {
    this.imageInputMode = mode;
    if (mode === 'url') {
      this.removeSelectedImage();
    } else {
      this.form.patchValue({ imageUrl: '' });
    }
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.snackbarService.show('Please select a valid image file.');
      input.value = '';
      return;
    }

    if (file.size > this.maxImageSizeBytes) {
      this.snackbarService.show('Image size must be 2 MB or smaller.');
      input.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        this.snackbarService.show('Failed to read the selected image.');
        return;
      }

      this.bookForm.imageData = reader.result;
      this.imagePreview = reader.result;
      this.selectedImageName = file.name;
    };
    reader.onerror = () => {
      this.snackbarService.show('Failed to read the selected image.');
    };
    reader.readAsDataURL(file);
  }

  onImageUrlBlur() {
    const url = this.normalizeImageUrl(this.form.get('imageUrl')?.value);
    if (url && this.isValidImageUrl(url)) {
      this.bookForm.imageData = url;
      this.imagePreview = url;
      this.selectedImageName = 'URL Image';
    }
  }

  onImageUrlInput() {
    const url = this.normalizeImageUrl(this.form.get('imageUrl')?.value);
    if (url && this.isValidImageUrl(url)) {
      this.bookForm.imageData = url;
      this.imagePreview = url;
      this.selectedImageName = 'URL Image';
    }
  }

  private normalizeImageUrl(url: string): string {
    const value = (url || '').trim();
    if (!value) return '';
    if (value.startsWith('www.')) {
      return `https://${value}`;
    }
    return value;
  }

  onImageLoadError() {
    if (this.imageInputMode === 'url' && this.imagePreview) {
      this.imagePreview = null;
      this.bookForm.imageData = null;
      this.selectedImageName = '';
      this.snackbarService.show('Failed to load image from URL. Please check the link.');
    }
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(this.normalizeImageUrl(url));
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  removeSelectedImage() {
    this.bookForm.imageData = null;
    this.imagePreview = null;
    this.selectedImageName = '';
    this.form.patchValue({ imageUrl: '' });
  }

  cleanIsbnInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    let value = input.value.replace(/\D/g, '');
    if (value.length > 13) {
      value = value.slice(0, 13);
    }
    input.value = value;
    this.form.get('isbn')?.setValue(value, { emitEvent: true });
  }

  getBookInitial(book: Pick<Book, 'title'>): string {
    return book.title.trim().charAt(0).toUpperCase() || 'B';
  }

  getCoverSrc(book: Pick<Book, 'imageData'>): string {
    const img = book.imageData;
    if (!img) return '';

    let imageData = img.toString().trim();
    if (!imageData || imageData === 'null' || imageData === 'undefined') return '';

    if (imageData.startsWith('www.')) {
      imageData = `https://${imageData}`;
    }

    if (/^(https?:\/\/|\/|assets\/)/i.test(imageData) || imageData.startsWith('data:')) {
      return imageData;
    }

    const compact = imageData.replace(/\s/g, '');
    if (compact.length < 40 || !/^[A-Za-z0-9+/=_-]+$/.test(compact)) {
      return '';
    }

    let base64 = compact.replace(/-/g, '+').replace(/_/g, '/');
    base64 = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
    return `data:image/jpeg;base64,${base64}`;
  }

  saveBook() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackbarService.show('Please fill in all required fields correctly.');
      return;
    }

    this.isLoading = true;

    const formValue = this.form.value;
    let imageData: string | null = null;

    if (this.imageInputMode === 'url' && formValue.imageUrl) {
      // URL mode: validate and normalize
      const normalizedUrl = this.normalizeImageUrl(formValue.imageUrl);
      if (!this.isValidImageUrl(normalizedUrl)) {
        this.isLoading = false;
        this.snackbarService.show('Invalid image URL. Please use a full http(s) link.');
        return;
      }
      imageData = normalizedUrl;
    } else if (this.imagePreview) {
      // File mode OR existing image: use whatever is in the preview
      imageData = this.imagePreview;
    } else if (this.isEditMode && this.bookForm.imageData) {
      // Edit mode fallback: keep original image if preview was cleared by accident
      imageData = this.bookForm.imageData;
    }

    const payload = {
      ...(this.bookForm.id && { id: this.bookForm.id }),
      title: formValue.title.trim(),
      isbn: formValue.isbn.trim(),
      author: formValue.author.trim(),
      category: formValue.category,
      imageData: imageData,
      totalCopies: formValue.totalCopies,
      price: formValue.price || null,
      summary: formValue.summary || null,
      authorInfo: formValue.authorInfo || null,
      bookUrl: formValue.bookUrl ? formValue.bookUrl.trim() : null
    } as Book;

    if (this.isEditMode && this.bookForm.id) {
      // Calculate availableCopies for update: keep existing available + adjust for total change
      const existingBook = this.editingBook as Book & { availableCopies?: number };
      const oldTotal = existingBook?.totalCopies ?? payload.totalCopies;
      const oldAvailable = existingBook?.availableCopies ?? payload.totalCopies;
      const totalDiff = payload.totalCopies - oldTotal;
      const newAvailable = Math.max(0, oldAvailable + totalDiff);
      const updatePayload = { ...payload, availableCopies: newAvailable };

      this.bookService.updateBook(this.bookForm.id, updatePayload).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackbarService.show('Book updated successfully!');
            this.loadBooks();
            this.closeModal();
          } else {
            this.snackbarService.show(response.message || 'Failed to update book');
          }
          this.isLoading = false;
        },
        error: () => {
          this.snackbarService.show('Failed to update book. Please try again.');
          this.isLoading = false;
        }
      });
    } else {
      this.bookService.addBook(payload).subscribe({
        next: (response) => {
          if (response.success) {
            this.snackbarService.show('Book added successfully!');
            this.loadBooks();
            this.closeModal();
          } else {
            this.snackbarService.show(response.message || 'Failed to add book');
          }
          this.isLoading = false;
        },
        error: () => {
          this.snackbarService.show('Failed to add book. Please try again.');
          this.isLoading = false;
        }
      });
    }
  }

  deleteBook(id: number) {
    if (confirm('Are you sure you want to delete this book?')) {
      this.isLoading = true;
      this.bookService.deleteBook(id).subscribe({
        next: (response) => {
          if (response.success) {
            this.loadBooks();
          } else {
            this.errorMessage = response.message;
          }
          this.isLoading = false;
        },
        error: (error) => {
          let userMessage = 'Failed to delete book';
          if (error.status === 404) {
            userMessage = 'Book not found';
          } else if (error.status >= 500) {
            userMessage = 'Server error. Please try again later.';
          }
          this.snackbarService.show(userMessage);
          this.isLoading = false;
        }
      });
    }
  }
}

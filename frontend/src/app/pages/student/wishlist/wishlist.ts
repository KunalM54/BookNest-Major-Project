import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { WishlistService, WishlistItem } from '../../../services/wishlist';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './wishlist.html',
  styleUrls: ['./wishlist.css']
})
export class WishlistComponent implements OnInit {
  wishlistItems: WishlistItem[] = [];
  isLoading = false;
  errorMessage = '';

  constructor(
    private wishlistService: WishlistService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loadWishlist();
  }

  loadWishlist() {
    const userId = this.authService.getUserId();
    if (!userId) {
      this.errorMessage = 'Please login to view your wishlist';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.wishlistService.getWishlist(userId).subscribe({
      next: (res) => {
        this.wishlistItems = res.data || [];
        this.isLoading = false;
      },
      error: (err) => {
        this.errorMessage = 'Failed to load wishlist';
        this.isLoading = false;
      }
    });
  }

  removeFromWishlist(bookId: number) {
    const userId = this.authService.getUserId();
    if (!userId) return;

    this.wishlistService.removeFromWishlist(userId, bookId).subscribe({
      next: (res) => {
        if (res.success) {
          this.wishlistItems = this.wishlistItems.filter(item => item.id !== bookId);
        }
      },
      error: () => {}
    });
  }

  viewBook(bookId: number) {
    this.router.navigate(['/books', bookId]);
  }

  getImageSource(item: WishlistItem): string {
    const img = item.imageData;
    if (!img) return '';
    
    let imageData = img.toString().trim();
    if (!imageData) return '';
    
    if (imageData.startsWith('data:image')) {
      return imageData;
    }
    
    if (imageData.startsWith('data:')) {
      return imageData;
    }
    
    try {
      const firstBytes = imageData.substring(0, 20);
      const decoded = atob(firstBytes);
      if (decoded.charCodeAt(0) === 0x89 && decoded.charCodeAt(1) === 0x50) {
        return `data:image/png;base64,${imageData}`;
      }
      if (decoded.charCodeAt(0) === 0xFF && decoded.charCodeAt(1) === 0xD8) {
        return `data:image/jpeg;base64,${imageData}`;
      }
    } catch (e) {}
    
    return `data:image/jpeg;base64,${imageData}`;
  }

  hasImage(item: WishlistItem): boolean {
    const img = item.imageData;
    return !!(img && img.toString().trim() && img.toString().trim().length > 10);
  }
}

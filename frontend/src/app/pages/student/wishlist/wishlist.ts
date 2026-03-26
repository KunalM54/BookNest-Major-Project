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
    if (!img || img === 'null' || img === 'undefined') return '';
    
    let imageData = img.toString().trim();
    if (!imageData) return '';

    if (imageData.startsWith('www.')) {
      imageData = `https://${imageData}`;
    }

    const isLikelyBase64 = (value: string): boolean => {
      const v = value.replace(/\s/g, '');
      if (v.length < 40) return false;
      return /^[A-Za-z0-9+/=_-]+$/.test(v);
    };

    if (/^(https?:\/\/|\/|assets\/)/i.test(imageData)) {
      return imageData;
    }

    if (imageData.startsWith('data:image') || imageData.startsWith('data:')) {
      return imageData;
    }

    if (!isLikelyBase64(imageData)) {
      return '';
    }

    imageData = imageData.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
    let padded = imageData.padEnd(imageData.length + (4 - imageData.length % 4) % 4, '=');

    try {
      const firstBytes = padded.substring(0, 32);
      const decoded = atob(firstBytes);

      if (decoded.charCodeAt(0) === 0x89 && decoded.charCodeAt(1) === 0x50) {
        return `data:image/png;base64,${padded}`;
      }
      if (decoded.charCodeAt(0) === 0xFF && decoded.charCodeAt(1) === 0xD8) {
        return `data:image/jpeg;base64,${padded}`;
      }
      if (decoded.charCodeAt(0) === 0x47 && decoded.charCodeAt(1) === 0x49) {
        return `data:image/gif;base64,${padded}`;
      }
    } catch (e) {}

    return `data:image/jpeg;base64,${padded}`;
  }

  hasImage(item: WishlistItem): boolean {
    const img = item.imageData;
    if (!img) return false;
    let value = img.toString().trim();
    if (!value) return false;
    if (value.startsWith('www.')) value = `https://${value}`;
    if (value.startsWith('data:')) return true;
    if (/^(https?:\/\/|\/|assets\/)/i.test(value)) return true;
    const v = value.replace(/\s/g, '');
    return v.length >= 40 && /^[A-Za-z0-9+/=_-]+$/.test(v);
  }
}

package com.booknest.backend.controller;

import com.booknest.backend.model.Book;
import com.booknest.backend.repository.BookRepository;
import com.booknest.backend.repository.BorrowRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/books")
@CrossOrigin(origins = "*")
public class BookController {

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private BorrowRepository borrowRepository;

    private String normalizeImageData(String imageData) {
        if (imageData == null) {
            return null;
        }

        String trimmedImageData = imageData.trim();
        if (trimmedImageData.isEmpty()) {
            return null;
        }

        // Check if it's just a file name (not actual image data)
        if (trimmedImageData.matches("^[\\w\\-]+\\.(png|jpg|jpeg|gif|svg|webp)$")) {
            System.out.println("Invalid image data detected (file name only): " + trimmedImageData);
            return null;
        }

        // If it's a URL, validate it
        if (trimmedImageData.startsWith("http://") || trimmedImageData.startsWith("https://")) {
            return trimmedImageData;
        }

        // If it starts with data:, validate format
        if (trimmedImageData.startsWith("data:image")) {
            return trimmedImageData;
        }

        // For base64, check minimum length (actual base64 images are much longer)
        if (trimmedImageData.length() < 100) {
            System.out.println("Invalid image data detected (too short for base64): " + trimmedImageData.substring(0, Math.min(50, trimmedImageData.length())));
            return null;
        }

        return trimmedImageData;
    }

    // Get all books
    @GetMapping
    public ResponseEntity<List<Book>> getAllBooks() {
        List<Book> books = bookRepository.findAll();
        books.forEach(book -> book.setImageData(validateImageData(book.getImageData())));
        return ResponseEntity.ok(books);
    }

    // Server-side pagination (non-breaking: new endpoint)
    @GetMapping("/paged")
    public ResponseEntity<Page<Book>> getBooksPaged(Pageable pageable) {
        return ResponseEntity.ok(bookRepository.findAll(pageable));
    }

    // Get book by ID
    @GetMapping("/{id}")
    public ResponseEntity<Book> getBookById(@PathVariable Long id) {
        return bookRepository.findById(id)
                .map(book -> {
                    book.setImageData(validateImageData(book.getImageData()));
                    return ResponseEntity.ok(book);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Validates and sanitizes image data, returning null for invalid data
    private String validateImageData(String imageData) {
        if (imageData == null || imageData.trim().isEmpty()) {
            return null;
        }
        
        String trimmed = imageData.trim();
        
        // Reject file names like "image.png", "cover.jpg", etc.
        if (trimmed.matches("^[\\w\\-]+\\.(png|jpg|jpeg|gif|svg|webp)$")) {
            System.out.println("Filtering out invalid image data (file name): " + trimmed);
            return null;
        }
        
        // Reject too-short base64 strings (not real image data)
        if (trimmed.length() < 100 && !trimmed.startsWith("http") && !trimmed.startsWith("data:")) {
            System.out.println("Filtering out invalid image data (too short): " + trimmed);
            return null;
        }
        
        return trimmed;
    }

    // Add new book
    @PostMapping
    public ResponseEntity<Map<String, Object>> addBook(@RequestBody Book book) {
        System.out.println("=== ADD BOOK REQUEST RECEIVED ===");
        System.out.println("Title: " + book.getTitle());
        System.out.println("ISBN: " + book.getIsbn());
        System.out.println("Author: " + book.getAuthor());
        System.out.println("Category: " + book.getCategory());
        System.out.println("TotalCopies: " + book.getTotalCopies());
        System.out.println("AvailableCopies received: " + book.getAvailableCopies());
        System.out.println("ImageData length: " + (book.getImageData() != null ? book.getImageData().length() : 0));
        System.out.println("Full book: " + book);
        System.out.println("=====================================");

        Map<String, Object> response = new HashMap<>();

        if (book.getTitle() == null || book.getTitle().trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Title is required");
            return ResponseEntity.badRequest().body(response);
        }

        if (book.getIsbn() == null || book.getIsbn().trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "ISBN is required");
            return ResponseEntity.badRequest().body(response);
        }

        if (!book.getIsbn().matches("\\d{13}")) {
            response.put("success", false);
            response.put("message", "ISBN must be exactly 13 numeric digits");
            return ResponseEntity.badRequest().body(response);
        }

        if (bookRepository.existsByIsbn(book.getIsbn())) {
            response.put("success", false);
            response.put("message", "ISBN already exists");
            System.out.println("VALIDATION FAILED: ISBN already exists");
            return ResponseEntity.badRequest().body(response);
        }

        // Validate imageData - reject if it's just a file name
        String imageData = book.getImageData();
        if (imageData != null && !imageData.trim().isEmpty()) {
            String trimmed = imageData.trim();
            if (trimmed.matches("^[\\w\\-]+\\.(png|jpg|jpeg|gif|svg|webp)$") || trimmed.length() < 100) {
                response.put("success", false);
                response.put("message", "Invalid image data. Please provide a valid image URL or base64 data.");
                return ResponseEntity.badRequest().body(response);
            }
        }

        if (book.getTotalCopies() == null || book.getTotalCopies() < 1) {
            book.setTotalCopies(1);
        }

        // Always set availableCopies = totalCopies for new books
        book.setAvailableCopies(book.getTotalCopies());

        if (book.getAvailableCopies() > book.getTotalCopies()) {
            book.setAvailableCopies(book.getTotalCopies());
        }

        book.setImageData(normalizeImageData(book.getImageData()));

        // Optional extended fields
        book.setSummary(book.getSummary() == null ? null : book.getSummary().trim());
        book.setAuthorInfo(book.getAuthorInfo() == null ? null : book.getAuthorInfo().trim());
        book.setBookUrl(book.getBookUrl() == null ? null : book.getBookUrl().trim());

        Book savedBook = bookRepository.save(book);
        response.put("success", true);
        response.put("message", "Book added successfully");
        response.put("book", savedBook);
        return ResponseEntity.ok(response);
    }

    // Update book
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateBook(@PathVariable Long id, @RequestBody Book bookDetails) {
        Map<String, Object> response = new HashMap<>();

        return bookRepository.findById(id)
                .map(book -> {
                    if (bookDetails.getIsbn() != null && !bookDetails.getIsbn().matches("\\d{13}")) {
                        response.put("success", false);
                        response.put("message", "ISBN must be exactly 13 numeric digits");
                        return ResponseEntity.badRequest().body(response);
                    }

                    if (bookDetails.getIsbn() != null && !bookDetails.getIsbn().equals(book.getIsbn())) {
                        if (bookRepository.existsByIsbn(bookDetails.getIsbn())) {
                            response.put("success", false);
                            response.put("message", "ISBN already exists for another book");
                            return ResponseEntity.badRequest().body(response);
                        }
                    }

                    book.setTitle(bookDetails.getTitle());
                    book.setIsbn(bookDetails.getIsbn());
                    book.setAuthor(bookDetails.getAuthor());
                    book.setCategory(bookDetails.getCategory());

                    if (bookDetails.getPrice() != null) {
                        book.setPrice(bookDetails.getPrice());
                    }
                    if (bookDetails.getSummary() != null) {
                        book.setSummary(bookDetails.getSummary().trim());
                    }
                    if (bookDetails.getAuthorInfo() != null) {
                        book.setAuthorInfo(bookDetails.getAuthorInfo().trim());
                    }
                    if (bookDetails.getBookUrl() != null) {
                        book.setBookUrl(bookDetails.getBookUrl().trim());
                    }

                    // Only update image if a new one is provided; preserve existing image otherwise
                    String newImageData = normalizeImageData(bookDetails.getImageData());
                    if (newImageData != null) {
                        book.setImageData(newImageData);
                    }

                    if (bookDetails.getTotalCopies() != null) {
                        int oldTotal = book.getTotalCopies() != null ? book.getTotalCopies() : 0;
                        int oldAvailable = book.getAvailableCopies() != null ? book.getAvailableCopies() : 0;
                        int newTotal = bookDetails.getTotalCopies();
                        int totalDiff = newTotal - oldTotal;
                        int newAvailable = Math.max(0, oldAvailable + totalDiff);
                        book.setTotalCopies(newTotal);
                        // If caller explicitly sends availableCopies, use that; otherwise auto-adjust
                        if (bookDetails.getAvailableCopies() != null) {
                            book.setAvailableCopies(Math.min(bookDetails.getAvailableCopies(), newTotal));
                        } else {
                            book.setAvailableCopies(Math.min(newAvailable, newTotal));
                        }
                    } else if (bookDetails.getAvailableCopies() != null) {
                        book.setAvailableCopies(bookDetails.getAvailableCopies());
                    }

                    if (book.getTotalCopies() != null && book.getAvailableCopies() != null
                            && book.getAvailableCopies() > book.getTotalCopies()) {
                        book.setAvailableCopies(book.getTotalCopies());
                    }

                    Book updatedBook = bookRepository.save(book);
                    response.put("success", true);
                    response.put("message", "Book updated successfully");
                    response.put("book", updatedBook);
                    return ResponseEntity.ok(response);
                })
                .orElseGet(() -> {
                    response.put("success", false);
                    response.put("message", "Book not found");
                    return ResponseEntity.notFound().build();
                });
    }

    // Delete book
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, Object>> deleteBook(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        if (!bookRepository.existsById(id)) {
            response.put("success", false);
            response.put("message", "Book not found");
            return ResponseEntity.notFound().build();
        }

        // Check for active borrows (PENDING, APPROVED, OVERDUE)
        long activeBorrows = borrowRepository.countActiveBorrowsForBook(id);
        if (activeBorrows > 0) {
            response.put("success", false);
            response.put("message", String.format(
                    "Cannot delete book with %d active borrow(s). Please handle borrows (return/approve/reject) first.",
                    activeBorrows));
            return ResponseEntity.badRequest().body(response);
        }

        bookRepository.deleteById(id);
        response.put("success", true);
        response.put("message", "Book deleted successfully");
        return ResponseEntity.ok(response);
    }
}

package com.booknest.backend.controller;

import com.booknest.backend.model.Wishlist;
import com.booknest.backend.service.WishlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "*")
public class WishlistController {

    @Autowired
    private WishlistService wishlistService;

    @GetMapping("/student/{studentId}")
    public ResponseEntity<Map<String, Object>> getWishlist(@PathVariable Long studentId) {
        List<Wishlist> wishlist = wishlistService.getWishlistByStudentId(studentId);
        
        List<Map<String, Object>> books = wishlist.stream()
            .map(w -> {
                Map<String, Object> book = new HashMap<>();
                book.put("id", w.getBook().getId());
                book.put("title", w.getBook().getTitle());
                book.put("author", w.getBook().getAuthor());
                book.put("category", w.getBook().getCategory());
                book.put("isbn", w.getBook().getIsbn());
                book.put("imageData", w.getBook().getImageData());
                book.put("availableCopies", w.getBook().getAvailableCopies());
                book.put("price", w.getBook().getPrice());
                book.put("addedAt", w.getAddedAt());
                return book;
            })
            .collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", books);
        response.put("count", books.size());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> addToWishlist(@RequestBody Map<String, Long> request) {
        Long studentId = request.get("studentId");
        Long bookId = request.get("bookId");
        
        Map<String, Object> result = wishlistService.addToWishlist(studentId, bookId);
        return ResponseEntity.ok(result);
    }

    @DeleteMapping("/remove")
    public ResponseEntity<Map<String, Object>> removeFromWishlist(@RequestBody Map<String, Long> request) {
        Long studentId = request.get("studentId");
        Long bookId = request.get("bookId");
        
        Map<String, Object> result = wishlistService.removeFromWishlist(studentId, bookId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/toggle")
    public ResponseEntity<Map<String, Object>> toggleWishlist(@RequestBody Map<String, Long> request) {
        Long studentId = request.get("studentId");
        Long bookId = request.get("bookId");
        
        Map<String, Object> result = wishlistService.toggleWishlist(studentId, bookId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/check/{studentId}/{bookId}")
    public ResponseEntity<Map<String, Object>> checkWishlist(
            @PathVariable Long studentId, 
            @PathVariable Long bookId) {
        
        boolean isInWishlist = wishlistService.isInWishlist(studentId, bookId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("inWishlist", isInWishlist);
        
        return ResponseEntity.ok(response);
    }
}

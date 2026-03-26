package com.booknest.backend.controller;

import com.booknest.backend.dto.CreateReviewRequest;
import com.booknest.backend.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {

    @Autowired
    private ReviewService reviewService;

    @GetMapping("/book/{bookId}")
    public ResponseEntity<Map<String, Object>> getReviewsForBook(@PathVariable Long bookId) {
        Map<String, Object> result = reviewService.getReviewsForBook(bookId);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    @GetMapping("/eligibility")
    public ResponseEntity<Map<String, Object>> canReview(@RequestParam Long bookId, @RequestParam Long studentId) {
        Map<String, Object> result = reviewService.canStudentReview(bookId, studentId);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }

    @PostMapping("/book/{bookId}")
    public ResponseEntity<Map<String, Object>> upsertReview(
            @PathVariable Long bookId,
            @RequestParam Long studentId,
            @Valid @RequestBody CreateReviewRequest request) {
        Map<String, Object> result = reviewService.upsertReview(bookId, studentId, request);
        if ((Boolean) result.get("success")) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.badRequest().body(result);
    }
}


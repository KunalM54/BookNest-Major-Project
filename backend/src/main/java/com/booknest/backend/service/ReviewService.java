package com.booknest.backend.service;

import com.booknest.backend.dto.CreateReviewRequest;
import com.booknest.backend.dto.ReviewDTO;
import com.booknest.backend.model.Book;
import com.booknest.backend.model.Borrow;
import com.booknest.backend.model.Review;
import com.booknest.backend.model.User;
import com.booknest.backend.repository.BookRepository;
import com.booknest.backend.repository.BorrowRepository;
import com.booknest.backend.repository.ReviewRepository;
import com.booknest.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ReviewService {
    @Autowired
    private ReviewRepository reviewRepository;
    @Autowired
    private BookRepository bookRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private BorrowRepository borrowRepository;

    public Map<String, Object> getReviewsForBook(Long bookId) {
        Map<String, Object> response = new HashMap<>();

        if (!bookRepository.existsById(bookId)) {
            response.put("success", false);
            response.put("message", "Book not found");
            return response;
        }

        List<ReviewDTO> reviews = reviewRepository.findByBookIdWithStudent(bookId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        Double avg = reviewRepository.getAverageRating(bookId);
        long total = reviewRepository.countByBookId(bookId);

        Map<String, Object> data = new HashMap<>();
        data.put("averageRating", avg == null ? 0.0 : avg);
        data.put("totalReviews", total);
        data.put("reviews", reviews);

        response.put("success", true);
        response.put("message", "Reviews fetched successfully");
        response.put("data", data);
        return response;
    }

    public Map<String, Object> canStudentReview(Long bookId, Long studentId) {
        Map<String, Object> response = new HashMap<>();

        if (!bookRepository.existsById(bookId)) {
            response.put("success", false);
            response.put("message", "Book not found");
            return response;
        }
        if (!userRepository.existsById(studentId)) {
            response.put("success", false);
            response.put("message", "Student not found");
            return response;
        }

        boolean hasReturned = borrowRepository.existsByStudentIdAndBookIdAndStatusIn(
                studentId, bookId, List.of(Borrow.BorrowStatus.RETURNED));

        Optional<Review> existing = reviewRepository.findByBookIdAndStudentId(bookId, studentId);

        Map<String, Object> data = new HashMap<>();
        data.put("eligible", hasReturned);
        data.put("hasExistingReview", existing.isPresent());
        existing.ifPresent(review -> data.put("review", toDto(review)));

        response.put("success", true);
        response.put("message", "Eligibility checked");
        response.put("data", data);
        return response;
    }

    @Transactional
    public Map<String, Object> upsertReview(Long bookId, Long studentId, CreateReviewRequest request) {
        Map<String, Object> response = new HashMap<>();

        Book book = bookRepository.findById(bookId).orElse(null);
        if (book == null) {
            response.put("success", false);
            response.put("message", "Book not found");
            return response;
        }

        User student = userRepository.findById(studentId).orElse(null);
        if (student == null) {
            response.put("success", false);
            response.put("message", "Student not found");
            return response;
        }

        boolean hasReturned = borrowRepository.existsByStudentIdAndBookIdAndStatusIn(
                studentId, bookId, List.of(Borrow.BorrowStatus.RETURNED));
        if (!hasReturned) {
            response.put("success", false);
            response.put("message", "You can review this book only after returning it");
            return response;
        }

        Review review = reviewRepository.findByBookIdAndStudentId(bookId, studentId).orElseGet(Review::new);
        review.setBook(book);
        review.setStudent(student);
        review.setRating(request.getRating());
        review.setComment(normalizeComment(request.getComment()));

        Review saved = reviewRepository.save(review);

        response.put("success", true);
        response.put("message", "Review saved successfully");
        response.put("data", toDto(saved));
        return response;
    }

    private String normalizeComment(String comment) {
        if (comment == null) {
            return null;
        }
        String trimmed = comment.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ReviewDTO toDto(Review r) {
        ReviewDTO dto = new ReviewDTO();
        dto.setId(r.getId());
        dto.setBookId(r.getBook() == null ? null : r.getBook().getId());
        dto.setStudentId(r.getStudent() == null ? null : r.getStudent().getId());
        dto.setStudentName(r.getStudent() == null ? null : r.getStudent().getFullName());
        dto.setRating(r.getRating());
        dto.setComment(r.getComment());
        dto.setCreatedAt(r.getCreatedAt());
        return dto;
    }
}


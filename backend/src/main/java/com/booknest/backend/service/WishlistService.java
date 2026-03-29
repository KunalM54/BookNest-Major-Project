package com.booknest.backend.service;

import com.booknest.backend.model.Book;
import com.booknest.backend.model.User;
import com.booknest.backend.model.Wishlist;
import com.booknest.backend.repository.BookRepository;
import com.booknest.backend.repository.UserRepository;
import com.booknest.backend.repository.WishlistRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class WishlistService {

    @Autowired
    private WishlistRepository wishlistRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    public List<Wishlist> getWishlistByStudentId(Long studentId) {
        return wishlistRepository.findByStudentIdOrderByAddedAtDesc(studentId);
    }

    public boolean isInWishlist(Long studentId, Long bookId) {
        return wishlistRepository.existsByStudentIdAndBookId(studentId, bookId);
    }

    @Transactional
    public Map<String, Object> addToWishlist(Long studentId, Long bookId) {
        Map<String, Object> response = new HashMap<>();

        Optional<User> studentOpt = userRepository.findById(studentId);
        Optional<Book> bookOpt = bookRepository.findById(bookId);

        if (!studentOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "Student not found");
            return response;
        }

        if (!bookOpt.isPresent()) {
            response.put("success", false);
            response.put("message", "Book not found");
            return response;
        }

        if (wishlistRepository.existsByStudentIdAndBookId(studentId, bookId)) {
            response.put("success", false);
            response.put("message", "Book already in wishlist");
            return response;
        }

        Wishlist wishlist = new Wishlist(studentOpt.get(), bookOpt.get());
        wishlistRepository.save(wishlist);

        response.put("success", true);
        response.put("action", "added");
        response.put("message", "Added to wishlist");
        return response;
    }

    @Transactional
    public Map<String, Object> removeFromWishlist(Long studentId, Long bookId) {
        Map<String, Object> response = new HashMap<>();

        Optional<Wishlist> wishlistOpt = wishlistRepository.findByStudentIdAndBookId(studentId, bookId);

        if (wishlistOpt.isPresent()) {
            wishlistRepository.delete(wishlistOpt.get());
            response.put("success", true);
            response.put("action", "removed");
            response.put("message", "Removed from wishlist");
        } else {
            response.put("success", false);
            response.put("message", "Book not in wishlist");
        }

        return response;
    }

    @Transactional
    public Map<String, Object> toggleWishlist(Long studentId, Long bookId) {
        if (isInWishlist(studentId, bookId)) {
            return removeFromWishlist(studentId, bookId);
        } else {
            return addToWishlist(studentId, bookId);
        }
    }
}

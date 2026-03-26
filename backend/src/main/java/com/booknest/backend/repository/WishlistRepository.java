package com.booknest.backend.repository;

import com.booknest.backend.model.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findByStudentIdOrderByAddedAtDesc(Long studentId);
    Optional<Wishlist> findByStudentIdAndBookId(Long studentId, Long bookId);
    boolean existsByStudentIdAndBookId(Long studentId, Long bookId);
    void deleteByStudentIdAndBookId(Long studentId, Long bookId);
}

package com.booknest.backend.repository;

import com.booknest.backend.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    @Query("SELECT r FROM Review r JOIN FETCH r.student s WHERE r.book.id = :bookId ORDER BY r.createdAt DESC")
    List<Review> findByBookIdWithStudent(Long bookId);

    Optional<Review> findByBookIdAndStudentId(Long bookId, Long studentId);

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.book.id = :bookId")
    Double getAverageRating(Long bookId);

    long countByBookId(Long bookId);
}


package com.booknest.backend.repository;

import com.booknest.backend.model.AvailabilityAlert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AvailabilityAlertRepository extends JpaRepository<AvailabilityAlert, Long> {
    List<AvailabilityAlert> findByStudentIdAndIsActiveTrue(Long studentId);
    
    @Query("SELECT a FROM AvailabilityAlert a WHERE a.book.id = :bookId AND a.isActive = true")
    List<AvailabilityAlert> findActiveAlertsByBookId(Long bookId);
    
    Optional<AvailabilityAlert> findByStudentIdAndBookIdAndIsActiveTrue(Long studentId, Long bookId);
    
    boolean existsByStudentIdAndBookIdAndIsActiveTrue(Long studentId, Long bookId);
}

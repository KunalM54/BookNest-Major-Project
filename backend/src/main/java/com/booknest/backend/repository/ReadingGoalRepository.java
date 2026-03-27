package com.booknest.backend.repository;

import com.booknest.backend.model.ReadingGoal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReadingGoalRepository extends JpaRepository<ReadingGoal, Long> {
    List<ReadingGoal> findByStudentIdOrderByCreatedAtDesc(Long studentId);
    
    @Query("SELECT r FROM ReadingGoal r WHERE r.student.id = :studentId AND r.endDate >= CURRENT_DATE AND r.isCompleted = false")
    List<ReadingGoal> findActiveGoalsByStudentId(Long studentId);
    
    Optional<ReadingGoal> findByIdAndStudentId(Long id, Long studentId);
}

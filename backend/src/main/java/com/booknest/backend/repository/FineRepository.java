package com.booknest.backend.repository;

import com.booknest.backend.model.Fine;
import com.booknest.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FineRepository extends JpaRepository<Fine, Long> {
    List<Fine> findByStudent(User student);
    List<Fine> findByStudentId(Long studentId);
    List<Fine> findByStudentIdAndStatus(Long studentId, Fine.FineStatus status);
    
    @Query("SELECT f FROM Fine f JOIN FETCH f.borrow b JOIN FETCH b.book JOIN FETCH f.student ORDER BY f.createdAt DESC")
    List<Fine> findAllWithDetails();
}

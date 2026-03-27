package com.booknest.backend.repository;

import com.booknest.backend.model.Fine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FineRepository extends JpaRepository<Fine, Long> {

    Optional<Fine> findByBorrowId(Long borrowId);

    @Query("SELECT f FROM Fine f JOIN FETCH f.borrow b JOIN FETCH b.book JOIN FETCH f.student WHERE f.student.id = :studentId ORDER BY f.createdAt DESC")
    List<Fine> findByStudentIdWithDetails(Long studentId);

    @Query("SELECT f FROM Fine f JOIN FETCH f.borrow b JOIN FETCH b.book JOIN FETCH f.student ORDER BY f.createdAt DESC")
    List<Fine> findAllWithDetails();

    List<Fine> findByStudentId(Long studentId);

    List<Fine> findByFineStatus(Fine.FineStatus status);

    @Query("SELECT f FROM Fine f WHERE f.fineStatus = :status AND f.student.id = :studentId")
    List<Fine> findByStudentIdAndFineStatus(Long studentId, Fine.FineStatus status);
}

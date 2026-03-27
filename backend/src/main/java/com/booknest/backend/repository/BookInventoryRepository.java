package com.booknest.backend.repository;

import com.booknest.backend.model.BookInventory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookInventoryRepository extends JpaRepository<BookInventory, Long> {
    List<BookInventory> findByBookId(Long bookId);
    Optional<BookInventory> findByBookIdAndConditionName(Long bookId, String conditionName);
    List<BookInventory> findByBookIdOrderByConditionNameAsc(Long bookId);
}

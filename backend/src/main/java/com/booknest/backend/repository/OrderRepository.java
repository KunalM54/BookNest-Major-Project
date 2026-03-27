package com.booknest.backend.repository;

import com.booknest.backend.model.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {

    List<Order> findByStudentIdOrderByCreatedAtDesc(Long studentId);

    List<Order> findByBookIdOrderByCreatedAtDesc(Long bookId);

    Optional<Order> findByStripePaymentIntentId(String paymentIntentId);

    Optional<Order> findByTransactionId(String transactionId);

    @Query("SELECT o FROM Order o WHERE o.student.id = :studentId AND o.status = :status ORDER BY o.createdAt DESC")
    List<Order> findByStudentIdAndStatus(@Param("studentId") Long studentId, @Param("status") Order.OrderStatus status);

    @Query("SELECT o FROM Order o JOIN FETCH o.book WHERE o.student.id = :studentId ORDER BY o.createdAt DESC")
    List<Order> findByStudentIdWithBook(@Param("studentId") Long studentId);

    @Query("SELECT o FROM Order o JOIN FETCH o.student JOIN FETCH o.book ORDER BY o.createdAt DESC")
    List<Order> findAllWithStudentAndBook();

    boolean existsByStudentIdAndBookIdAndStatus(Long studentId, Long bookId, Order.OrderStatus status);

    long countByStudentId(Long studentId);

    long countByStatus(Order.OrderStatus status);
}

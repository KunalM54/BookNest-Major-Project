package com.booknest.backend.repository;

import com.booknest.backend.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Payment> findByUserIdAndPaymentTypeOrderByCreatedAtDesc(Long userId, Payment.PaymentType paymentType);

    List<Payment> findByPaymentTypeOrderByCreatedAtDesc(Payment.PaymentType paymentType);

    Optional<Payment> findByTransactionId(String transactionId);

    @Query("SELECT p FROM Payment p WHERE p.referenceId = :refId AND p.paymentType = :type AND p.status = :status")
    Optional<Payment> findByReferenceIdAndTypeAndStatus(
            @Param("refId") Long referenceId,
            @Param("type") Payment.PaymentType type,
            @Param("status") Payment.PaymentStatus status);

    @Query("SELECT SUM(p.amount) FROM Payment p WHERE p.paymentType = :type AND p.status = 'SUCCESS'")
    Double getTotalRevenueByType(@Param("type") Payment.PaymentType type);

    boolean existsByReferenceIdAndPaymentTypeAndStatus(Long referenceId, Payment.PaymentType paymentType, Payment.PaymentStatus status);
}

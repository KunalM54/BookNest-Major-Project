package com.booknest.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "fines", uniqueConstraints = {
        @UniqueConstraint(name = "uk_fines_borrow_id", columnNames = { "borrow_id" })
})
public class Fine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "borrow_id", nullable = false)
    private Borrow borrow;

    @Column(nullable = false)
    private Integer daysOverdue;

    @Column(name = "fine_amount", nullable = false)
    private Double fineAmount;

    @Column(name = "fine_per_day", nullable = false)
    private Double finePerDay;

    @Column(name = "paid_amount", nullable = false)
    private Double paidAmount = 0.0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FineStatus status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "payment_method")
    private String paymentMethod;

    public enum FineStatus {
        PENDING,
        PAID
    }

    public Fine() {
    }

    public Fine(User student, Borrow borrow, Integer daysOverdue, Double finePerDay) {
        this.student = student;
        this.borrow = borrow;
        this.daysOverdue = daysOverdue;
        this.finePerDay = finePerDay;
        this.fineAmount = daysOverdue * finePerDay;
        this.paidAmount = 0.0;
        this.status = FineStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getStudent() {
        return student;
    }

    public void setStudent(User student) {
        this.student = student;
    }

    public Borrow getBorrow() {
        return borrow;
    }

    public void setBorrow(Borrow borrow) {
        this.borrow = borrow;
    }

    public Integer getDaysOverdue() {
        return daysOverdue;
    }

    public void setDaysOverdue(Integer daysOverdue) {
        this.daysOverdue = daysOverdue;
    }

    public Double getFineAmount() {
        return fineAmount;
    }

    public void setFineAmount(Double fineAmount) {
        this.fineAmount = fineAmount;
    }

    public Double getFinePerDay() {
        return finePerDay;
    }

    public void setFinePerDay(Double finePerDay) {
        this.finePerDay = finePerDay;
    }

    public Double getPaidAmount() {
        return paidAmount;
    }

    public void setPaidAmount(Double paidAmount) {
        this.paidAmount = paidAmount;
    }

    public FineStatus getStatus() {
        return status;
    }

    public void setStatus(FineStatus status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
}

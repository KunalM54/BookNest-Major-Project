package com.booknest.backend.service;

import com.booknest.backend.model.*;
import com.booknest.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class UnifiedPaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private FineRepository fineRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private FineService fineService;

    /**
     * Process a book purchase payment
     */
    @Transactional
    public Map<String, Object> processBookPayment(Long studentId, Long bookId) {
        Map<String, Object> response = new HashMap<>();

        Optional<User> userOpt = userRepository.findById(studentId);
        if (userOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "User not found");
            return response;
        }

        Optional<Book> bookOpt = bookRepository.findById(bookId);
        if (bookOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Book not found");
            return response;
        }

        Book book = bookOpt.get();
        if (book.getPrice() == null || book.getPrice() <= 0) {
            response.put("success", false);
            response.put("message", "This book is not available for purchase");
            return response;
        }

        // Check if already purchased
        if (orderRepository.existsByStudentIdAndBookIdAndStatus(studentId, bookId, Order.OrderStatus.COMPLETED)) {
            response.put("success", false);
            response.put("message", "You have already purchased this book");
            return response;
        }

        User user = userOpt.get();

        // Create order (pending)
        Order order = new Order(user, book, book.getPrice());
        order.setPaymentMethod("DEMO");
        order = orderRepository.save(order);
        order.setTransactionId("ORD" + order.getId());
        order = orderRepository.save(order);

        // Create payment record
        Payment payment = new Payment(user, book.getPrice(), Payment.PaymentType.BOOK, bookId);
        payment.setReferenceId(order.getId());
        payment.setTransactionId("PAY" + payment.getId() + "_BOOK");
        payment = paymentRepository.save(payment);

        response.put("success", true);
        response.put("orderId", order.getTransactionId());
        response.put("orderDbId", order.getId());
        response.put("paymentId", payment.getId());
        response.put("amount", book.getPrice());
        response.put("bookTitle", book.getTitle());
        response.put("studentName", user.getFullName());
        response.put("studentEmail", user.getEmail());
        response.put("paymentMode", "DEMO");

        return response;
    }

    /**
     * Verify and complete book purchase payment
     */
    @Transactional
    public Map<String, Object> verifyBookPayment(String transactionId) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (transactionId != null && transactionId.startsWith("ORD")) {
                Long orderId = Long.parseLong(transactionId.substring(3));
                Optional<Order> orderOpt = orderRepository.findById(orderId);

                if (orderOpt.isPresent()) {
                    Order order = orderOpt.get();

                    if (order.getStatus() == Order.OrderStatus.COMPLETED) {
                        response.put("success", false);
                        response.put("message", "Order already completed");
                        return response;
                    }

                    order.setStatus(Order.OrderStatus.COMPLETED);
                    order.setPaidAt(LocalDateTime.now());
                    orderRepository.save(order);

                    // Update payment status
                    paymentRepository.findByReferenceIdAndTypeAndStatus(
                            order.getId(), Payment.PaymentType.BOOK, Payment.PaymentStatus.PENDING
                    ).ifPresent(payment -> {
                        payment.setStatus(Payment.PaymentStatus.SUCCESS);
                        paymentRepository.save(payment);
                    });

                    response.put("success", true);
                    response.put("message", "Payment successful");
                    response.put("order", order);
                    return response;
                }
            }

            response.put("success", false);
            response.put("message", "Order not found");
            return response;

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Payment error: " + e.getMessage());
            return response;
        }
    }

    /**
     * Process fine payment
     */
    @Transactional
    public Map<String, Object> processFinePayment(Long studentId, Long fineId) {
        Map<String, Object> response = new HashMap<>();

        Optional<User> userOpt = userRepository.findById(studentId);
        if (userOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "User not found");
            return response;
        }

        Optional<Fine> fineOpt = fineRepository.findById(fineId);
        if (fineOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Fine not found");
            return response;
        }

        Fine fine = fineOpt.get();

        // Check if already paid
        if (fine.getFineStatus() == Fine.FineStatus.PAID) {
            response.put("success", false);
            response.put("message", "Fine already paid");
            return response;
        }

        User user = userOpt.get();

        // Create payment record
        Payment payment = new Payment(user, fine.getFineAmount(), Payment.PaymentType.FINE, fineId);
        payment.setTransactionId("PAY" + payment.getId() + "_FINE");
        payment.setFineDescription("Fine for late return of: " + 
                (fine.getBorrow() != null && fine.getBorrow().getBook() != null ? 
                        fine.getBorrow().getBook().getTitle() : "book"));
        payment = paymentRepository.save(payment);

        response.put("success", true);
        response.put("paymentId", payment.getId());
        response.put("transactionId", payment.getTransactionId());
        response.put("amount", fine.getFineAmount());
        response.put("fineId", fineId);
        response.put("fineDescription", payment.getFineDescription());
        response.put("studentName", user.getFullName());
        response.put("studentEmail", user.getEmail());
        response.put("paymentMode", "DEMO");

        return response;
    }

    /**
     * Verify and complete fine payment
     */
    @Transactional
    public Map<String, Object> verifyFinePayment(String transactionId, Long fineId) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Find the payment
            Optional<Payment> paymentOpt = paymentRepository.findByTransactionId(transactionId);
            
            if (paymentOpt.isEmpty()) {
                response.put("success", false);
                response.put("message", "Payment not found");
                return response;
            }

            Payment payment = paymentOpt.get();

            if (payment.getStatus() == Payment.PaymentStatus.SUCCESS) {
                response.put("success", false);
                response.put("message", "Payment already completed");
                return response;
            }

            // Update payment status
            payment.setStatus(Payment.PaymentStatus.SUCCESS);
            paymentRepository.save(payment);

            // Update fine status
            Optional<Fine> fineOpt = fineRepository.findById(fineId);
            if (fineOpt.isPresent()) {
                Fine fine = fineOpt.get();
                fine.setFineStatus(Fine.FineStatus.PAID);
                fine.setPaymentId(payment.getId());
                fineRepository.save(fine);
            }

            response.put("success", true);
            response.put("message", "Fine payment successful");
            response.put("payment", payment);
            return response;

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Payment error: " + e.getMessage());
            return response;
        }
    }

    /**
     * Get all payments for a user
     */
    public List<Payment> getPaymentsByUser(Long userId) {
        List<Payment> payments = paymentRepository.findByUserIdOrderByCreatedAtDesc(userId);
        for (Payment payment : payments) {
            payment.populateTransientFields();
        }
        return payments;
    }

    /**
     * Get all payments (admin)
     */
    public List<Payment> getAllPayments() {
        List<Payment> payments = paymentRepository.findAll();
        for (Payment payment : payments) {
            payment.populateTransientFields();
        }
        return payments;
    }

    /**
     * Get payment by ID
     */
    public Optional<Payment> getPaymentById(Long paymentId) {
        Optional<Payment> paymentOpt = paymentRepository.findById(paymentId);
        paymentOpt.ifPresent(Payment::populateTransientFields);
        return paymentOpt;
    }

    /**
     * Get total revenue by payment type
     */
    public double getTotalRevenue(Payment.PaymentType type) {
        Double revenue = paymentRepository.getTotalRevenueByType(type);
        return revenue != null ? revenue : 0.0;
    }
}

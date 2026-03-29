package com.booknest.backend.service;

import com.booknest.backend.model.Book;
import com.booknest.backend.model.Fine;
import com.booknest.backend.model.Order;
import com.booknest.backend.model.User;
import com.booknest.backend.repository.BookRepository;
import com.booknest.backend.repository.FineRepository;
import com.booknest.backend.repository.OrderRepository;
import com.booknest.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class DemoPaymentService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private FineRepository fineRepository;

    @Autowired
    private FineService fineService;

    @Transactional
    public Map<String, Object> createBookPurchaseOrder(Long studentId, Long bookId) {
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

        if (orderRepository.existsByStudentIdAndBookIdAndStatus(studentId, bookId, Order.OrderStatus.COMPLETED)) {
            response.put("success", false);
            response.put("message", "You have already purchased this book");
            return response;
        }

        User user = userOpt.get();

        Order order = new Order(user, book, book.getPrice());
        order.setPaymentMethod("DEMO");
        order = orderRepository.save(order);
        order.setTransactionId("ORD" + order.getId());
        order = orderRepository.save(order);

        response.put("success", true);
        response.put("orderId", order.getTransactionId());
        response.put("orderDbId", order.getId());
        response.put("amount", book.getPrice());
        response.put("currency", "INR");
        response.put("studentName", user.getFullName());
        response.put("studentEmail", user.getEmail());
        response.put("bookTitle", book.getTitle());
        response.put("paymentMode", "DEMO");

        return response;
    }

    @Transactional
    public Map<String, Object> createFinePaymentOrder(Long studentId, Long fineId) {
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
        double outstanding = fine.getFineAmount();

        if (fine.getFineStatus() == Fine.FineStatus.PAID) {
            response.put("success", false);
            response.put("message", "This fine has already been paid");
            return response;
        }

        User user = userOpt.get();
        String bookTitle = "Fine Payment";
        if (fine.getBorrow() != null && fine.getBorrow().getBook() != null) {
            bookTitle = fine.getBorrow().getBook().getTitle();
        }

        String transactionId = "DEMO_FINE_" + System.currentTimeMillis() + "_" + studentId + "_" + fineId;

        response.put("success", true);
        response.put("orderId", transactionId);
        response.put("amount", outstanding);
        response.put("fineId", fineId);
        response.put("currency", "INR");
        response.put("studentName", user.getFullName());
        response.put("studentEmail", user.getEmail());
        response.put("description", "Fine Payment - " + bookTitle);
        response.put("paymentMode", "DEMO");

        return response;
    }

    @Transactional
    public Map<String, Object> verifyAndSaveBookPayment(String transactionId) {
        Map<String, Object> response = new HashMap<>();

        System.out.println("=== Payment Verification Debug ===");
        System.out.println("Received transactionId: " + transactionId);

        try {
            if (transactionId != null && transactionId.startsWith("ORD")) {
                String orderIdStr = transactionId.substring(3);
                System.out.println("Extracted order ID string: " + orderIdStr);
                
                Long orderDbId = Long.parseLong(orderIdStr);
                System.out.println("Parsed order ID: " + orderDbId);
                
                Optional<Order> orderOpt = orderRepository.findById(orderDbId);
                System.out.println("Order found: " + orderOpt.isPresent());
                
                if (orderOpt.isPresent()) {
                    Order order = orderOpt.get();
                    System.out.println("Current order status BEFORE: " + order.getStatus().name());
                    order.setStatus(Order.OrderStatus.COMPLETED);
                    order.setPaidAt(LocalDateTime.now());
                    orderRepository.save(order);
                    
                    // Refresh to verify
                    Optional<Order> refreshed = orderRepository.findById(orderDbId);
                    if (refreshed.isPresent()) {
                        System.out.println("Current order status AFTER save: " + refreshed.get().getStatus().name());
                    }
                    System.out.println("Order status updated to COMPLETED");

                    response.put("success", true);
                    response.put("message", "Payment successful (Demo Mode)");
                    response.put("order", order);
                    return response;
                } else {
                    System.out.println("Order not found in database");
                }
            } else {
                System.out.println("Transaction ID does not start with ORD or is null");
            }

            response.put("success", false);
            response.put("message", "Order not found - transactionId: " + transactionId);
            return response;

        } catch (Exception e) {
            System.out.println("Exception: " + e.getMessage());
            e.printStackTrace();
            response.put("success", false);
            response.put("message", "Payment verification error: " + e.getMessage());
            return response;
        }
    }

    @Transactional
    public Map<String, Object> verifyAndSaveFinePayment(String transactionId, Long fineId) {
        Map<String, Object> response = new HashMap<>();

        try {
            fineService.payFine(fineId, null);

            response.put("success", true);
            response.put("message", "Fine payment successful (Demo Mode)");
            return response;

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Payment verification error: " + e.getMessage());
            return response;
        }
    }

    public List<Order> getOrdersByStudent(Long studentId) {
        List<Order> orders = orderRepository.findByStudentIdWithBook(studentId);
        for (Order order : orders) {
            order.populateTransientFields();
        }
        return orders;
    }

    public Optional<Order> getOrderById(Long orderId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        orderOpt.ifPresent(Order::populateTransientFields);
        return orderOpt;
    }

    public List<Order> getAllOrders() {
        List<Order> orders = orderRepository.findAllWithStudentAndBook();
        for (Order order : orders) {
            order.populateTransientFields();
        }
        return orders;
    }

    public List<Order> getOrdersByStatus(Order.OrderStatus status) {
        return orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == status)
                .toList();
    }

    @Transactional
    public Map<String, Object> markOrderAsGiven(Long orderId) {
        Map<String, Object> response = new HashMap<>();

        System.out.println("=== Mark as Given Debug ===");
        System.out.println("Order ID received: " + orderId);

        Optional<Order> orderOpt = orderRepository.findById(orderId);
        System.out.println("Order found: " + orderOpt.isPresent());
        
        if (orderOpt.isEmpty()) {
            System.out.println("Order not found in database");
            response.put("success", false);
            response.put("message", "Order not found");
            return response;
        }

        Order order = orderOpt.get();
        System.out.println("Current order status: " + order.getStatus());
        System.out.println("Status name: " + order.getStatus().name());
        System.out.println("Expected COMPLETED: " + Order.OrderStatus.COMPLETED.name());
        
        if (!Order.OrderStatus.COMPLETED.name().equals(order.getStatus().name())) {
            String msg = "Order must be completed before marking as given. Current status: " + order.getStatus().name();
            System.out.println(msg);
            response.put("success", false);
            response.put("message", msg);
            return response;
        }

        order.setStatus(Order.OrderStatus.GIVEN);
        order.setGivenAt(LocalDateTime.now());
        orderRepository.save(order);
        System.out.println("Order marked as GIVEN");

        response.put("success", true);
        response.put("message", "Book marked as given to student");
        response.put("order", order);
        return response;
    }

    @Transactional
    public Map<String, Object> cancelOrder(Long orderId) {
        Map<String, Object> response = new HashMap<>();
        
        if (orderId == null) {
            response.put("success", true);
            response.put("message", "No order to cancel");
            return response;
        }
        
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            response.put("success", true);
            response.put("message", "Order not found, nothing to cancel");
            return response;
        }
        
        Order order = orderOpt.get();
        if (order.getStatus() == Order.OrderStatus.PENDING) {
            orderRepository.delete(order);
            response.put("success", true);
            response.put("message", "Order cancelled successfully");
        } else {
            response.put("success", false);
            response.put("message", "Cannot cancel order with status: " + order.getStatus());
        }
        
        return response;
    }
}

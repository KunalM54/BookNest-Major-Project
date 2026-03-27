package com.booknest.backend.controller;

import com.booknest.backend.model.Order;
import com.booknest.backend.service.DemoPaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/demo-payment")
@CrossOrigin(origins = "*")
public class DemoPaymentController {

    @Autowired
    private DemoPaymentService demoPaymentService;

    @PostMapping("/book/create-order")
    public ResponseEntity<Map<String, Object>> createBookPurchaseOrder(
            @RequestParam Long studentId,
            @RequestParam Long bookId) {
        Map<String, Object> result = demoPaymentService.createBookPurchaseOrder(studentId, bookId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/fine/create-order")
    public ResponseEntity<Map<String, Object>> createFinePaymentOrder(
            @RequestParam Long studentId,
            @RequestParam Long fineId) {
        Map<String, Object> result = demoPaymentService.createFinePaymentOrder(studentId, fineId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/book/verify")
    public ResponseEntity<Map<String, Object>> verifyBookPayment(
            @RequestParam String transactionId) {
        Map<String, Object> result = demoPaymentService.verifyAndSaveBookPayment(transactionId);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/fine/verify")
    public ResponseEntity<Map<String, Object>> verifyFinePayment(
            @RequestParam String transactionId,
            @RequestParam Long fineId) {
        Map<String, Object> result = demoPaymentService.verifyAndSaveFinePayment(transactionId, fineId);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/orders/{studentId}")
    public ResponseEntity<Map<String, Object>> getOrdersByStudent(@PathVariable Long studentId) {
        List<Order> orders = demoPaymentService.getOrdersByStudent(studentId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", orders);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/orders/details/{orderId}")
    public ResponseEntity<Map<String, Object>> getOrderById(@PathVariable Long orderId) {
        Optional<Order> orderOpt = demoPaymentService.getOrderById(orderId);
        
        Map<String, Object> response = new HashMap<>();
        if (orderOpt.isPresent()) {
            response.put("success", true);
            response.put("data", orderOpt.get());
        } else {
            response.put("success", false);
            response.put("message", "Order not found");
        }
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/all")
    public ResponseEntity<Map<String, Object>> getAllOrders() {
        List<Order> orders = demoPaymentService.getAllOrders();
        double totalRevenue = orders.stream()
                .filter(o -> o.getStatus() == Order.OrderStatus.COMPLETED || o.getStatus() == Order.OrderStatus.GIVEN)
                .mapToDouble(o -> o.getAmount() != null ? o.getAmount() : 0)
                .sum();
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", orders);
        response.put("totalOrders", orders.size());
        response.put("totalRevenue", totalRevenue);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/admin/mark-given/{orderId}")
    public ResponseEntity<Map<String, Object>> markOrderAsGiven(@PathVariable Long orderId) {
        Map<String, Object> result = demoPaymentService.markOrderAsGiven(orderId);
        return ResponseEntity.ok(result);
    }
}

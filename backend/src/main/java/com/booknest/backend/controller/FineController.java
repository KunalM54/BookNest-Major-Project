package com.booknest.backend.controller;

import com.booknest.backend.model.Borrow;
import com.booknest.backend.model.Fine;
import com.booknest.backend.repository.BorrowRepository;
import com.booknest.backend.service.FineService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/fines")
@CrossOrigin(origins = "*")
public class FineController {

    @Autowired
    private FineService fineService;

    @Autowired
    private BorrowRepository borrowRepository;

    @GetMapping("/student/{studentId}")
    public ResponseEntity<Map<String, Object>> getFinesByStudent(@PathVariable Long studentId) {
        List<Fine> fines = fineService.recalculateFinesForStudent(studentId);
        double totalPending = fineService.getTotalPendingFine(studentId);
         
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", fines);
        response.put("totalPending", totalPending);
         
        return ResponseEntity.ok(response);
    }

    @GetMapping("/student/{studentId}/all")
    public ResponseEntity<Map<String, Object>> getAllFinesByStudent(@PathVariable Long studentId) {
        List<Fine> fines = fineService.recalculateFinesForStudent(studentId);
        double totalPending = fineService.getTotalPendingFine(studentId);
         
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", fines);
        response.put("totalPending", totalPending);
         
        return ResponseEntity.ok(response);
    }

    @PostMapping("/pay/{fineId}")
    public ResponseEntity<Map<String, Object>> payFine(
            @PathVariable Long fineId,
            @RequestBody Map<String, String> paymentRequest) {
         
        String paymentMethod = paymentRequest.getOrDefault("paymentMethod", "CASH");
        Double amount = null;
        try {
            if (paymentRequest.containsKey("amount")) {
                amount = Double.parseDouble(paymentRequest.get("amount"));
            }
        } catch (Exception ignored) {
        }
         
        Fine paidFine = fineService.payFine(fineId, paymentMethod, amount);
         
        Map<String, Object> response = new HashMap<>();
        if (paidFine != null) {
            response.put("success", true);
            response.put("message", "Fine paid successfully");
            response.put("data", paidFine);
        } else {
            response.put("success", false);
            response.put("message", "Fine not found");
        }
         
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{fineId}/pay")
    public ResponseEntity<Map<String, Object>> payFinePut(
            @PathVariable Long fineId,
            @RequestBody Map<String, String> paymentRequest) {
        return payFine(fineId, paymentRequest);
    }

    @GetMapping("/calculate")
    public ResponseEntity<Map<String, Object>> calculateFine(@RequestParam int daysOverdue) {
        double fineAmount = fineService.calculateFineForDays(daysOverdue);
         
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("daysOverdue", daysOverdue);
        response.put("finePerDay", fineService.getFinePerDay());
        response.put("totalFine", fineAmount);
         
        return ResponseEntity.ok(response);
    }

    @GetMapping("/borrow/{borrowId}")
    public ResponseEntity<Map<String, Object>> calculateFineForBorrow(@PathVariable Long borrowId) {
        Optional<Borrow> borrowOpt = borrowRepository.findById(borrowId);
         
        Map<String, Object> response = new HashMap<>();
        if (borrowOpt.isEmpty()) {
            response.put("success", false);
            response.put("message", "Borrow not found");
            return ResponseEntity.ok(response);
        }
         
        Map<String, Object> fineInfo = fineService.calculateFineForBorrow(borrowOpt.get());
        response.put("success", true);
        response.put("data", fineInfo);
         
        return ResponseEntity.ok(response);
    }

    @GetMapping("/student/{studentId}/calculate")
    public ResponseEntity<Map<String, Object>> calculateFinesForStudent(@PathVariable Long studentId) {
        List<Borrow> borrows = borrowRepository.findByStudentIdOrderByRequestDateDesc(studentId);
         
        List<Map<String, Object>> fines = fineService.calculateFinesForBorrows(borrows);
         
        double totalPending = fines.stream()
            .filter(f -> "OVERDUE".equals(f.get("status")) || "RETURNED_LATE".equals(f.get("status")))
            .mapToDouble(f -> (Double) f.get("fineAmount"))
            .sum();
         
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", fines);
        response.put("totalPending", totalPending);
         
        return ResponseEntity.ok(response);
    }

    @GetMapping("/admin/all")
    public ResponseEntity<Map<String, Object>> getAllFinesAdmin() {
        List<Fine> fines = fineService.getAllFinesWithDetails();
        double totalPending = fineService.getTotalPendingFines();
        long pendingCount = fineService.getPendingFinesCount();
         
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", fines);
        response.put("totalPending", totalPending);
        response.put("pendingCount", pendingCount);
         
        return ResponseEntity.ok(response);
    }
}
